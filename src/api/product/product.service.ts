import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SelectQueryBuilder } from 'typeorm';
import { ProductRepository } from 'src/core/repository/product.repository';
import { ProductImageRepository } from 'src/core/repository/product-image.repository';
import { Product } from 'src/core/entity/product.entity';
import { ProductImage } from 'src/core/entity/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreatePromotionDto } from './dto/promotion.dto';
import { PaginationDto, PaginationResult } from 'src/common/dto/pagination.dto';
import { FileUploadService } from 'src/common/service/file-upload.service';
import {
  IEngagementEvent,
  IPromotionHistoryRecord,
  IPromotionHistoryRecordGet,
  IUserShare,
} from 'src/common/interfaces';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly repository: ProductRepository,
    @InjectRepository(ProductImage)
    private readonly imageRepository: ProductImageRepository,
    private readonly fileUploadService: FileUploadService,
  ) {}

  // Pagination helper method
  private async paginateQuery<T extends Record<string, any>>(
    queryBuilder: SelectQueryBuilder<T>,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<T>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async create(
    createProductDto: CreateProductDto,
    userId: string,
  ): Promise<Product> {
    try {
      // Validate userId
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      // Validate required fields
      if (!createProductDto.name || createProductDto.name.trim() === '') {
        throw new BadRequestException('Product name is required');
      }

      // Listing ID ni yaratish (8 xonali raqam)
      const listingId = Math.floor(
        10000000 + Math.random() * 90000000,
      ).toString();

      // Generate slug from product name
      const slug = this.generateSlug(createProductDto.name);

      // Clean up date fields - convert invalid strings to undefined for TypeORM
      const cleanedDto = {
        ...createProductDto,
        should_expired_at:
          this.parseDateOrNull(createProductDto.should_expired_at) || undefined,
        first_published_at:
          this.parseDateOrNull(createProductDto.first_published_at) ||
          undefined,
      };

      const product = this.repository.create({
        ...cleanedDto,
        created_by_id: userId,
        listing_id: listingId,
        slug: slug,
        tab: 'draft', // New products start in draft status
        status: 500, // Default status
      });

      // Save the product first
      const savedProduct = await this.repository.save(product);

      // Update publishable status
      return await this.updateProductPublishableStatus(savedProduct);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  /**
   * Generate a URL-friendly slug from a string
   * @param text The text to convert to a slug
   * @returns The generated slug
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Parse date string or return null if invalid
   * @param dateString The date string to parse
   * @returns Date object or null
   */
  private parseDateOrNull(dateString: string | null | undefined): Date | null {
    if (!dateString || dateString === 'string' || dateString === '') {
      return null;
    }
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  // Image handling methods
  async uploadProductImages(
    productId: string,
    files: Express.Multer.File[],
  ): Promise<ProductImage[]> {
    const product = await this.findOne(productId);

    if (files.length > 6) {
      throw new BadRequestException('Maximum 6 images allowed per product');
    }

    const images: ProductImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const uploadResult = await this.fileUploadService.uploadImage(
        file,
        productId,
        product.slug, // Pass the product slug for directory structure
      );

      const image = this.imageRepository.create({
        ...uploadResult,
        product_id: productId,
        order_index: i,
        is_main: i === 0, // First image is main by default
      });

      images.push(await this.imageRepository.save(image));
    }

    // Update product publishable status
    const updatedProduct = await this.findOne(productId);
    await this.updateProductPublishableStatus(updatedProduct);

    return images;
  }

  async setMainImage(
    productId: string,
    imageId: string,
  ): Promise<ProductImage> {
    const product = await this.findOne(productId);

    // Reset all images to not main
    await this.imageRepository.update(
      { product_id: productId },
      { is_main: false },
    );

    // Set selected image as main
    const image = await this.imageRepository.findOne({
      where: { id: imageId, product_id: productId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    image.is_main = true;
    return await this.imageRepository.save(image);
  }

  async deleteProductImage(productId: string, imageId: string): Promise<void> {
    const image = await this.imageRepository.findOne({
      where: { id: imageId, product_id: productId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    // Delete file from disk
    await this.fileUploadService.deleteImage(image.filename);

    // Delete from database
    await this.imageRepository.remove(image);

    // If this was the main image, set the first remaining image as main
    if (image.is_main) {
      const remainingImages = await this.imageRepository.find({
        where: { product_id: productId },
        order: { order_index: 'ASC' },
      });

      if (remainingImages.length > 0) {
        remainingImages[0].is_main = true;
        await this.imageRepository.save(remainingImages[0]);
      }
    }

    // Update product publishable status
    const updatedProduct = await this.findOne(productId);
    await this.updateProductPublishableStatus(updatedProduct);
  }

  async reorderImages(
    productId: string,
    imageIds: string[],
  ): Promise<ProductImage[]> {
    const product = await this.findOne(productId);

    const images: ProductImage[] = [];

    for (let i = 0; i < imageIds.length; i++) {
      const image = await this.imageRepository.findOne({
        where: { id: imageIds[i], product_id: productId },
      });

      if (!image) {
        throw new NotFoundException(`Image with id ${imageIds[i]} not found`);
      }

      image.order_index = i;
      image.is_main = i === 0; // First in order is main
      images.push(await this.imageRepository.save(image));
    }

    // Update product publishable status
    const updatedProduct = await this.findOne(productId);
    await this.updateProductPublishableStatus(updatedProduct);

    return images;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    // First get the products without relations
    const [products, total] = await this.repository.findAndCount({
      where: { is_active: true },
      order: {
        is_promoted: 'DESC',
        promotion_type: 'DESC',
        created_at: 'DESC',
      },
      skip,
      take: limit,
    });

    // Load relations for each product
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        const productWithRelations = await this.repository.findOne({
          where: { id: product.id },
          relations: ['created_by', 'images'],
          order: { images: { order_index: 'ASC' } },
        });
        return productWithRelations;
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: productsWithRelations.filter(Boolean) as Product[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id, is_active: true },
      relations: ['created_by', 'images'],
      order: { images: { order_index: 'ASC' } },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Ko'rishlar sonini oshirish
    product.views_count += 1;
    await this.repository.save(product);

    return product;
  }

  async getProductImagesCount(productId: string): Promise<number> {
    const count = await this.imageRepository.count({
      where: { product_id: productId },
    });
    return count;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Update slug if name is being updated
    if (updateProductDto.name && !updateProductDto.slug) {
      updateProductDto.slug = this.generateSlug(updateProductDto.name);
    }

    Object.assign(product, updateProductDto);
    const updatedProduct = await this.repository.save(product);
    return await this.updateProductPublishableStatus(updatedProduct);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);

    // Delete all images
    const images = await this.imageRepository.find({
      where: { product_id: id },
    });

    for (const image of images) {
      await this.fileUploadService.deleteImage(image.filename);
    }

    await this.imageRepository.remove(images);

    product.is_active = false;
    await this.repository.save(product);
  }

  async findByUser(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.created_by_id = :userId', { userId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC')
      .addOrderBy('product.promotion_type', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Qidiruv va filtrlash
  async search(
    query: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere(
        '(product.name ILIKE :query OR product.description ILIKE :query)',
        { query: `%${query}%` },
      )
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Kategoriya bo'yicha filtrlash
  async findByCategory(
    category: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.category = :category', { category })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Holat bo'yicha filtrlash
  async findByCondition(
    condition: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.condition = :condition', { condition })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Narx oralig'i bo'yicha filtrlash
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere('product.price >= :minPrice', { minPrice })
      .andWhere('product.price <= :maxPrice', { maxPrice })
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Bepul mahsulotlar
  async findFreeProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.is_free = :isFree', { isFree: true })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Shoshilinch sotuvlar
  async findUrgentProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.is_urgent = :isUrgent', { isUrgent: true })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Yetkazib berish bilan
  async findProductsWithDelivery(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.has_delivery = :hasDelivery', { hasDelivery: true })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  // Ko'p ko'rilgan mahsulotlar
  async findMostViewedProducts(limit: number = 10): Promise<Product[]> {
    return await this.repository.find({
      where: { is_active: true },
      relations: ['created_by', 'images'],
      order: {
        views_count: 'DESC',
        images: { order_index: 'ASC' },
      },
      take: limit,
    });
  }

  // Sevimli mahsulotlar
  async findMostFavoritedProducts(limit: number = 10): Promise<Product[]> {
    return await this.repository.find({
      where: { is_active: true },
      relations: ['created_by', 'images'],
      order: {
        favorites_count: 'DESC',
        images: { order_index: 'ASC' },
      },
      take: limit,
    });
  }

  // Mahsulotni sevimlilarga qo'shish
  async addToFavorites(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.favorites_count += 1;
    return await this.repository.save(product);
  }

  // Mahsulotni sevimlilardan olib tashlash
  async removeFromFavorites(id: string): Promise<Product> {
    const product = await this.findOne(id);
    if (product.favorites_count > 0) {
      product.favorites_count -= 1;
    }
    return await this.repository.save(product);
  }

  // Mahsulot statistikalarini olish
  async getProductStats(productId: string): Promise<{
    views_count: number;
    favorites_count: number;
    likes_count: number;
    calls_count: number;
    contacts_count: number;
  }> {
    const product = await this.findOne(productId);

    return {
      views_count: product.views_count,
      favorites_count: product.favorites_count,
      likes_count: product.likes_count,
      calls_count: product.calls_count,
      contacts_count: product.contacts_count,
    };
  }

  // Engagement tracking methods
  async addLike(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.likes_count += 1;

    // Add to engagement history
    await this.addToEngagementHistory(id, 'like', {});

    return await this.repository.save(product);
  }

  async removeLike(id: string): Promise<Product> {
    const product = await this.findOne(id);
    if (product.likes_count > 0) {
      product.likes_count -= 1;
    }
    return await this.repository.save(product);
  }

  async addCall(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.calls_count += 1;

    // Add to engagement history
    await this.addToEngagementHistory(id, 'call', {});

    return await this.repository.save(product);
  }

  async addContact(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.contacts_count += 1;

    // Add to engagement history
    await this.addToEngagementHistory(id, 'contact', {});

    return await this.repository.save(product);
  }

  async addShare(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.shares_count += 1;

    // Add to engagement history
    await this.addToEngagementHistory(id, 'share', {});

    // Update user's total shares
    const user = (await this.repository.manager.findOne('User', {
      where: { id: product.created_by_id },
      select: {
        id: true,
        total_shares: true,
        total_comments: true,
        total_reports: true,
      },
    })) as IUserShare;
    if (user) {
      user.total_shares += 1;
      await this.repository.manager.save('User', user);
    }

    return await this.repository.save(product);
  }

  async addComment(
    id: string,
    userId: string,
    comment: string,
  ): Promise<Product> {
    const product = await this.findOne(id);
    product.comments_count += 1;

    // Add to engagement history
    await this.addToEngagementHistory(id, 'comment', { userId, comment });

    // Update user's total comments
    const user = (await this.repository.manager.findOne('User', {
      where: { id: userId },
      select: {
        id: true,
        total_shares: true,
        total_comments: true,
        total_reports: true,
      },
    })) as IUserShare;
    if (user) {
      user.total_comments += 1;
      await this.repository.manager.save('User', user);
    }

    return await this.repository.save(product);
  }

  async reportProduct(
    id: string,
    userId: string,
    reason: string,
  ): Promise<Product> {
    const product = await this.findOne(id);
    product.reports_count += 1;

    // Add to engagement history
    await this.addToEngagementHistory(id, 'report', { userId, reason });

    // Update user's total reports
    const user = (await this.repository.manager.findOne('User', {
      where: { id: userId },
      select: {
        id: true,
        total_shares: true,
        total_comments: true,
        total_reports: true,
      },
    })) as IUserShare;
    if (user) {
      user.total_reports += 1;
      await this.repository.manager.save('User', user);
    }

    return await this.repository.save(product);
  }

  private async addToEngagementHistory(
    productId: string,
    type: string,
    data: any,
  ): Promise<void> {
    const product = await this.repository.findOne({
      where: { id: productId },
    });

    if (!product) {
      return;
    }

    // Create engagement event
    const engagementEvent: IEngagementEvent = {
      type,
      timestamp: new Date(),
      data,
    };

    // Update engagement history
    let history: IEngagementEvent[] = [];
    if (product.engagement_history) {
      try {
        const parsed = JSON.parse(product.engagement_history);
        history = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        // If parsing fails, start with empty array
        console.error('Failed to parse engagement history:', e);
        history = [];
      }
    }
    history.push(engagementEvent);

    product.engagement_history = JSON.stringify(history);
    await this.repository.save(product);
  }

  async getEngagementHistory(productId: string): Promise<any[]> {
    const product = await this.repository.findOne({
      where: { id: productId },
    });

    if (!product || !product.engagement_history) {
      return [];
    }

    try {
      return JSON.parse(product.engagement_history);
    } catch (e) {
      return [];
    }
  }

  async getEngagementAnalytics(productId: string): Promise<any> {
    const product = await this.findOne(productId);

    return {
      product_id: product.id,
      product_name: product.name,
      views_count: product.views_count,
      likes_count: product.likes_count,
      calls_count: product.calls_count,
      contacts_count: product.contacts_count,
      shares_count: product.shares_count,
      comments_count: product.comments_count,
      reports_count: product.reports_count,
      favorites_count: product.favorites_count,
      promotion_views_count: product.promotion_views_count,
      promotion_likes_count: product.promotion_likes_count,
      promotion_calls_count: product.promotion_calls_count,
      promotion_contacts_count: product.promotion_contacts_count,
      promotion_favorites_count: product.promotion_favorites_count,
    };
  }

  // Advertising system methods
  async getPromotionOptions(): Promise<{
    maxi: { price: number; duration: number; features: any };
    premium: { price: number; duration: number; features: any };
    urgent: { price: number; duration: number; features: any };
  }> {
    return {
      maxi: {
        price: 12900,
        duration: 7,
        features: {
          large_photo: true,
          premium_badge: true,
          photo_gallery: true,
          direct_contacts: true,
        },
      },
      premium: {
        price: 25000,
        duration: 14,
        features: {
          large_photo: true,
          premium_badge: true,
          photo_gallery: true,
          direct_contacts: true,
        },
      },
      urgent: {
        price: 5000,
        duration: 3,
        features: {
          large_photo: false,
          premium_badge: false,
          photo_gallery: false,
          direct_contacts: true,
        },
      },
    };
  }

  async createPromotion(
    productId: string,
    promotionDto: CreatePromotionDto,
  ): Promise<Product> {
    const product = await this.findOne(productId);

    // Promotion options
    const promotionOptions = await this.getPromotionOptions();
    const selectedOption = promotionOptions[promotionDto.promotion_type];

    if (!selectedOption) {
      throw new BadRequestException('Invalid promotion type');
    }

    // Promotion ma'lumotlarini saqlash
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + promotionDto.duration_days);

    Object.assign(product, {
      is_promoted: true,
      promotion_type: promotionDto.promotion_type,
      promotion_start_date: startDate,
      promotion_end_date: endDate,
      promotion_price: selectedOption.price,
      promotion_duration_days: promotionDto.duration_days,
      has_large_photo: selectedOption.features.large_photo,
      has_premium_badge: selectedOption.features.premium_badge,
      has_photo_gallery: selectedOption.features.photo_gallery,
      has_direct_contacts: selectedOption.features.direct_contacts,
      last_promotion_at: new Date(),
    });

    return await this.repository.save(product);
  }

  async cancelPromotion(productId: string): Promise<Product> {
    const product = await this.findOne(productId);

    if (!product.is_promoted) {
      throw new BadRequestException('Product is not promoted');
    }

    // Add to promotion history before cancelling
    const promotionRecord: IPromotionHistoryRecord = {
      type: product.promotion_type,
      start_date: product.promotion_start_date,
      end_date: product.promotion_end_date,
      price: product.promotion_price,
      duration_days: product.promotion_duration_days,
      cancelled_at: new Date(),
    };

    // Update promotion history with proper typing
    let history: IPromotionHistoryRecord[] = [];
    if (product.promotion_history) {
      try {
        const parsed = JSON.parse(product.promotion_history);
        history = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        console.error('Failed to parse promotion history:', e);
        history = [];
      }
    }
    history.push(promotionRecord);

    Object.assign(product, {
      is_promoted: false,
      promotion_type: null,
      promotion_start_date: null,
      promotion_end_date: null,
      promotion_price: null,
      promotion_duration_days: null,
      has_large_photo: false,
      has_premium_badge: false,
      has_photo_gallery: false,
      has_direct_contacts: false,
      promotion_history: JSON.stringify(history),
      total_promotion_spent:
        product.total_promotion_spent + (product.promotion_price || 0),
      last_promotion_at: new Date(),
    });

    return await this.repository.save(product);
  }

  async getPromotedProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.is_promoted = :isPromoted', { isPromoted: true })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.promotion_start_date', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  async getProductEngagement(productId: string): Promise<{
    views: number;
    likes: number;
    calls: number;
    contacts: number;
    favorites: number;
  }> {
    const product = await this.findOne(productId);

    return {
      views: product.views_count,
      likes: product.likes_count,
      calls: product.calls_count,
      contacts: product.contacts_count,
      favorites: product.favorites_count,
    };
  }

  // User ning barcha e'lonlarining engagement statistikalarini olish
  async getUserProductsEngagement(userId: string): Promise<{
    total_views: number;
    total_likes: number;
    total_calls: number;
    total_contacts: number;
    total_favorites: number;
    products: Array<{
      id: string;
      name: string;
      views: number;
      likes: number;
      calls: number;
      contacts: number;
      favorites: number;
    }>;
  }> {
    const products = await this.repository.find({
      where: { created_by_id: userId, is_active: true },
    });

    const totalStats = products.reduce(
      (acc, product) => ({
        total_views: acc.total_views + product.views_count,
        total_likes: acc.total_likes + product.likes_count,
        total_calls: acc.total_calls + product.calls_count,
        total_contacts: acc.total_contacts + product.contacts_count,
        total_favorites: acc.total_favorites + product.favorites_count,
      }),
      {
        total_views: 0,
        total_likes: 0,
        total_calls: 0,
        total_contacts: 0,
        total_favorites: 0,
      },
    );

    const productsStats = products.map((product) => ({
      id: product.id,
      name: product.name,
      views: product.views_count,
      likes: product.likes_count,
      calls: product.calls_count,
      contacts: product.contacts_count,
      favorites: product.favorites_count,
    }));

    return {
      ...totalStats,
      products: productsStats,
    };
  }

  // O'xshash mahsulotlarni topish
  async findSimilarProducts(
    productId: string,
    limit: number = 4,
  ): Promise<Product[]> {
    const currentProduct = await this.findOne(productId);

    return await this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.id != :productId', { productId })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .andWhere(
        '(product.category = :category OR product.subcategory = :subcategory)',
        {
          category: currentProduct.category,
          subcategory: currentProduct.subcategory,
        },
      )
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.views_count', 'DESC') // Ko'p ko'rilganlar
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC')
      .limit(limit)
      .getMany();
  }

  // Sotuvchining boshqa e'lonlarini olish
  async findSellerOtherProducts(
    productId: string,
    limit: number = 4,
  ): Promise<Product[]> {
    const currentProduct = await this.findOne(productId);
    const sellerId = currentProduct.created_by_id;

    return await this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.created_by_id = :sellerId', { sellerId })
      .andWhere('product.id != :excludeProductId', {
        excludeProductId: productId,
      })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC') // Reklama qilinganlar birinchi
      .addOrderBy('product.promotion_type', 'DESC') // Maxi > Premium > Urgent
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC')
      .limit(limit)
      .getMany();
  }

  // Mahsulot ma'lumotlarini to'liq olish (listing ID bilan)
  async findOneWithDetails(id: string): Promise<Product> {
    return await this.findOne(id);
  }

  // Draft/Published logic methods
  /**
   * Check if a product is publishable based on validation rules
   * @param product The product to check
   * @returns Array of validation issues, empty if publishable
   */
  checkProductPublishable(product: Product): string[] {
    const issues: string[] = [];

    // Check if product has a name
    if (!product.name || product.name.trim() === '') {
      issues.push('Отсутствует заголовок');
    }

    // Check if product has a description
    if (!product.description || product.description.trim() === '') {
      issues.push('Отсутствует описание');
    }

    // Check if product has a price (unless it's free)
    if (!product.is_free && (!product.price || product.price <= 0)) {
      issues.push('Отсутствует цена');
    }

    // Check if product has at least one image
    if (!product.images || product.images.length === 0) {
      issues.push('Отсутствует изображение');
    }

    // Check if product has a category
    if (!product.category || product.category.trim() === '') {
      issues.push('Отсутствует категория');
    }

    // Check if product has a location
    if (!product.location || product.location.trim() === '') {
      issues.push('Отсутствует местоположение');
    }

    return issues;
  }

  /**
   * Update product publishable status and issues
   * @param product The product to update
   * @returns Updated product
   */
  async updateProductPublishableStatus(product: Product): Promise<Product> {
    try {
      // Load product images if not already loaded
      if (!product.images) {
        product.images = await this.imageRepository.find({
          where: { product_id: product.id },
          order: { order_index: 'ASC' },
        });
      }

      // Check if product is publishable
      const issues = this.checkProductPublishable(product);
      const isPublishable = issues.length === 0;

      // Update product fields
      product.publishable = isPublishable;
      product.issues = JSON.stringify(issues);

      // If product is publishable and in draft status, we can publish it
      if (isPublishable && product.tab === 'draft') {
        product.tab = 'published';
        product.first_published_at = new Date();
      }

      return await this.repository.save(product);
    } catch (error) {
      console.error('Error updating product publishable status:', error);
      // Return product as-is if there's an error with publishable status update
      return product;
    }
  }

  /**
   * Publish a product
   * @param productId The product ID to publish
   * @returns Published product
   */
  async publishProduct(productId: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
      relations: ['images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is publishable
    const issues = this.checkProductPublishable(product);

    if (issues.length > 0) {
      throw new BadRequestException(
        'Product is not publishable due to the following issues: ' +
          issues.join(', '),
      );
    }

    // Update product status to published
    product.tab = 'published';
    product.publishable = true;
    product.issues = JSON.stringify([]);

    // Set first published date if not already set
    if (!product.first_published_at) {
      product.first_published_at = new Date();
    }

    return await this.repository.save(product);
  }

  /**
   * Unpublish a product (move to draft)
   * @param productId The product ID to unpublish
   * @returns Unpublished product
   */
  async unpublishProduct(productId: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update product status to draft
    product.tab = 'draft';
    product.publishable = false;

    return await this.repository.save(product);
  }

  /**
   * Get products by tab status (draft, published, etc.)
   * @param tab The tab status to filter by
   * @param paginationDto Pagination parameters
   * @returns Paginated products
   */
  async findByTab(
    tab: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.tab = :tab', { tab })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  /**
   * Get draft products for a user
   * @param userId The user ID to filter by
   * @param paginationDto Pagination parameters
   * @returns Paginated draft products
   */
  async findDraftProductsByUser(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.created_by_id = :userId', { userId })
      .andWhere('product.tab = :tab', { tab: 'draft' })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  /**
   * Submit a product for review
   * @param productId The product ID to submit for review
   * @returns Submitted product
   */
  async submitForReview(productId: string): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is publishable
    const issues = this.checkProductPublishable(product);

    if (issues.length > 0) {
      throw new BadRequestException(
        'Product is not publishable due to the following issues: ' +
          issues.join(', '),
      );
    }

    // Update product status to pending review
    product.tab = 'pending_review';
    product.submitted_for_review_at = new Date();
    product.publishable = true;
    product.issues = JSON.stringify([]);

    return await this.repository.save(product);
  }

  /**
   * Approve a product (moderator action)
   * @param productId The product ID to approve
   * @param moderatorId The ID of the moderator approving the product
   * @returns Approved product
   */
  async approveProduct(
    productId: string,
    moderatorId: string,
  ): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update product status to published
    product.tab = 'published';
    product.last_reviewed_at = new Date();
    product.reviewed_by_id = moderatorId;

    // Set first published date if not already set
    if (!product.first_published_at) {
      product.first_published_at = new Date();
    }

    return await this.repository.save(product);
  }

  /**
   * Reject a product (moderator action)
   * @param productId The product ID to reject
   * @param moderatorId The ID of the moderator rejecting the product
   * @param reason The reason for rejection
   * @returns Rejected product
   */
  async rejectProduct(
    productId: string,
    moderatorId: string,
    reason: string,
  ): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update product status to draft with rejection reason
    product.tab = 'draft';
    product.last_reviewed_at = new Date();
    product.reviewed_by_id = moderatorId;
    product.rejected_reason = reason;
    product.status_reason = `Rejected: ${reason}`;

    return await this.repository.save(product);
  }

  /**
   * Get products pending review (moderator functionality)
   * @param paginationDto Pagination parameters
   * @returns Paginated products pending review
   */
  async getPendingReviewProducts(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.tab = :tab', { tab: 'pending_review' })
      .andWhere('product.is_active = :isActive', { isActive: true })
      .orderBy('product.submitted_for_review_at', 'ASC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
  }

  /**
   * Update product status with reason
   * @param productId The product ID to update
   * @param status The new status
   * @param reason The reason for status change (optional)
   * @returns Updated product
   */
  async updateProductStatus(
    productId: string,
    status: string,
    reason?: string,
  ): Promise<Product> {
    const product = await this.repository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.tab = status;
    if (reason) {
      product.status_reason = reason;
    }

    return await this.repository.save(product);
  }

  /**
   * Get promotion history for a user
   * @param userId The user ID to get promotion history for
   * @returns Array of promotion history records
   */
  async getPromotionHistory(
    userId: string,
  ): Promise<IPromotionHistoryRecordGet[]> {
    const products = await this.repository.find({
      where: { created_by_id: userId },
    });

    const allPromotionHistory: IPromotionHistoryRecordGet[] = [];

    for (const product of products) {
      // Add current promotion if active
      if (product.is_promoted) {
        const currentPromotion: IPromotionHistoryRecordGet = {
          product_id: product.id,
          product_name: product.name,
          type: product.promotion_type,
          start_date: product.promotion_start_date,
          end_date: product.promotion_end_date,
          price: product.promotion_price,
          duration_days: product.promotion_duration_days,
          status: 'active',
        };
        allPromotionHistory.push(currentPromotion);
      }

      // Add historical promotions
      if (product.promotion_history) {
        try {
          const history: Array<{
            type: string | null;
            start_date: Date | null;
            end_date: Date | null;
            price: number | null;
            duration_days: number | null;
            cancelled_at?: Date;
          }> = JSON.parse(product.promotion_history);

          for (const record of history) {
            allPromotionHistory.push({
              product_id: product.id,
              product_name: product.name,
              ...record,
              status: record.cancelled_at ? 'cancelled' : 'expired',
            });
          }
        } catch (e) {
          console.error(
            `Failed to parse promotion history for product ${product.id}:`,
            e,
          );
        }
      }
    }

    // Sort by start date descending (with null checks)
    allPromotionHistory.sort((a, b) => {
      const aDate = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bDate = b.start_date ? new Date(b.start_date).getTime() : 0;
      return bDate - aDate;
    });

    return allPromotionHistory;
  }

  /**
   * Get promotion analytics for a product
   * @param productId The product ID to get analytics for
   * @returns Promotion analytics data
   */
  async getPromotionAnalytics(productId: string): Promise<any> {
    const product = await this.findOne(productId);

    return {
      product_id: product.id,
      product_name: product.name,
      total_promotion_spent: product.total_promotion_spent,
      last_promotion_at: product.last_promotion_at,
      promotion_views_count: product.promotion_views_count,
      promotion_likes_count: product.promotion_likes_count,
      promotion_calls_count: product.promotion_calls_count,
      promotion_contacts_count: product.promotion_contacts_count,
      promotion_favorites_count: product.promotion_favorites_count,
      current_promotion: product.is_promoted
        ? {
            type: product.promotion_type,
            start_date: product.promotion_start_date,
            end_date: product.promotion_end_date,
            price: product.promotion_price,
            duration_days: product.promotion_duration_days,
          }
        : null,
    };
  }

  /**
   * Extend promotion duration
   * @param productId The product ID to extend promotion for
   * @param days Number of days to extend
   * @returns Updated product
   */
  async extendPromotion(productId: string, days: number): Promise<Product> {
    const product = await this.findOne(productId);

    if (!product.is_promoted) {
      throw new BadRequestException('Product is not promoted');
    }

    // Extend end date
    const newEndDate = new Date(product.promotion_end_date);
    newEndDate.setDate(newEndDate.getDate() + days);

    product.promotion_end_date = newEndDate;
    product.promotion_duration_days += days;

    return await this.repository.save(product);
  }

  /**
   * Reactivate expired promotion
   * @param productId The product ID to reactivate promotion for
   * @returns Updated product
   */
  async reactivatePromotion(productId: string): Promise<Product> {
    const product = await this.findOne(productId);

    // Check if product has promotion history
    if (!product.promotion_history) {
      throw new BadRequestException('Product has no promotion history');
    }

    try {
      const history = JSON.parse(product.promotion_history);
      if (history.length === 0) {
        throw new BadRequestException('Product has no promotion history');
      }

      // Get the last promotion record
      const lastPromotion = history[history.length - 1];

      // Reactivate with same settings
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + lastPromotion.duration_days);

      Object.assign(product, {
        is_promoted: true,
        promotion_type: lastPromotion.type,
        promotion_start_date: startDate,
        promotion_end_date: endDate,
        promotion_price: lastPromotion.price,
        promotion_duration_days: lastPromotion.duration_days,
        has_large_photo: lastPromotion.features?.large_photo || false,
        has_premium_badge: lastPromotion.features?.premium_badge || false,
        has_photo_gallery: lastPromotion.features?.photo_gallery || false,
        has_direct_contacts: lastPromotion.features?.direct_contacts || false,
        last_promotion_at: new Date(),
      });

      return await this.repository.save(product);
    } catch (e) {
      throw new BadRequestException('Failed to reactivate promotion');
    }
  }
}
