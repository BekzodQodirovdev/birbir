import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProductRepository } from 'src/core/repository/product.repository';
import { ProductImageRepository } from 'src/core/repository/product-image.repository';
import { Product } from 'src/core/entity/product.entity';
import { ProductImage } from 'src/core/entity/product-image.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreatePromotionDto } from './dto/promotion.dto';
import { PaginationDto, PaginationResult } from 'src/common/dto/pagination.dto';
import { FileUploadService } from 'src/common/service/file-upload.service';

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
    // Listing ID ni yaratish (8 xonali raqam)
    const listingId = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString();

    const product = this.repository.create({
      ...createProductDto,
      created_by_id: userId,
      listing_id: listingId,
    });
    return await this.repository.save(product);
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
      );

      const image = this.imageRepository.create({
        ...uploadResult,
        product_id: productId,
        order_index: i,
        is_main: i === 0, // First image is main by default
      });

      images.push(await this.imageRepository.save(image));
    }

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

    return images;
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginationResult<Product>> {
    const queryBuilder = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.created_by', 'user')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.is_active = :isActive', { isActive: true })
      .orderBy('product.is_promoted', 'DESC')
      .addOrderBy('product.promotion_type', 'DESC')
      .addOrderBy('product.created_at', 'DESC')
      .addOrderBy('images.order_index', 'ASC');

    return await this.paginateQuery(queryBuilder, paginationDto);
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    Object.assign(product, updateProductDto);
    return await this.repository.save(product);
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
    return await this.repository.save(product);
  }

  async addContact(id: string): Promise<Product> {
    const product = await this.findOne(id);
    product.contacts_count += 1;
    return await this.repository.save(product);
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
    });

    return await this.repository.save(product);
  }

  async cancelPromotion(productId: string): Promise<Product> {
    const product = await this.findOne(productId);

    if (!product.is_promoted) {
      throw new BadRequestException('Product is not promoted');
    }

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
}
