import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreatePromotionDto } from './dto/promotion.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { Product } from 'src/core/entity/product.entity';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    role: string;
  };
}

@ApiTags('Products')
@Controller('products')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: RequestWithUser,
  ) {
    try {
      // Validate user authentication
      if (!req.user || !req.user.sub) {
        throw new BadRequestException('User not authenticated');
      }

      return this.productService.create(createProductDto, req.user.sub);
    } catch (error) {
      console.error('Error in product creation:', error);
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all active products with pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productService.findAll(paginationDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  search(@Query('q') query: string, @Query() paginationDto: PaginationDto) {
    return this.productService.search(query, paginationDto);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category with pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findByCategory(
    @Param('category') category: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productService.findByCategory(category, paginationDto);
  }

  @Get('condition/:condition')
  @ApiOperation({ summary: 'Get products by condition with pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findByCondition(
    @Param('condition') condition: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productService.findByCondition(condition, paginationDto);
  }

  @Get('price-range')
  @ApiOperation({ summary: 'Get products by price range with pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  findByPriceRange(
    @Query('min') minPrice: number,
    @Query('max') maxPrice: number,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productService.findByPriceRange(
      minPrice,
      maxPrice,
      paginationDto,
    );
  }

  @Get('free')
  @ApiOperation({ summary: 'Get free products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Free products retrieved successfully',
  })
  findFreeProducts(@Query() paginationDto: PaginationDto) {
    return this.productService.findFreeProducts(paginationDto);
  }

  @Get('urgent')
  @ApiOperation({ summary: 'Get urgent products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Urgent products retrieved successfully',
  })
  findUrgentProducts(@Query() paginationDto: PaginationDto) {
    return this.productService.findUrgentProducts(paginationDto);
  }

  @Get('with-delivery')
  @ApiOperation({ summary: 'Get products with delivery with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Products with delivery retrieved successfully',
  })
  findProductsWithDelivery(@Query() paginationDto: PaginationDto) {
    return this.productService.findProductsWithDelivery(paginationDto);
  }

  @Get('most-viewed')
  @ApiOperation({ summary: 'Get most viewed products' })
  @ApiResponse({
    status: 200,
    description: 'Most viewed products retrieved successfully',
  })
  findMostViewedProducts(@Query('limit') limit: number = 10) {
    return this.productService.findMostViewedProducts(limit);
  }

  @Get('most-favorited')
  @ApiOperation({ summary: 'Get most favorited products' })
  @ApiResponse({
    status: 200,
    description: 'Most favorited products retrieved successfully',
  })
  findMostFavoritedProducts(@Query('limit') limit: number = 10) {
    return this.productService.findMostFavoritedProducts(limit);
  }

  @Get('promoted')
  @ApiOperation({ summary: 'Get promoted products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Promoted products retrieved successfully',
  })
  getPromotedProducts(@Query() paginationDto: PaginationDto) {
    return this.productService.getPromotedProducts(paginationDto);
  }

  @Get('my-products')
  @ApiOperation({ summary: 'Get current user products with pagination' })
  @ApiResponse({
    status: 200,
    description: 'User products retrieved successfully',
  })
  findMyProducts(
    @Request() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productService.findByUser(req.user.sub, paginationDto);
  }

  @Get('my-products/engagement')
  @ApiOperation({ summary: 'Get current user products engagement statistics' })
  @ApiResponse({
    status: 200,
    description: 'Engagement statistics retrieved successfully',
  })
  getMyProductsEngagement(@Request() req: RequestWithUser) {
    return this.productService.getUserProductsEngagement(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: Product,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({
    status: 200,
    description: 'Product statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductStats(@Param('id') id: string) {
    return this.productService.getProductStats(id);
  }

  @Get(':id/engagement')
  @ApiOperation({ summary: 'Get product engagement statistics' })
  @ApiResponse({
    status: 200,
    description: 'Engagement statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductEngagement(@Param('id') id: string) {
    return this.productService.getProductEngagement(id);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar products' })
  @ApiResponse({
    status: 200,
    description: 'Similar products retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getSimilarProducts(
    @Param('id') id: string,
    @Query('limit') limit: number = 4,
  ) {
    return this.productService.findSimilarProducts(id, limit);
  }

  @Get(':id/seller-other-products')
  @ApiOperation({ summary: "Get seller's other products" })
  @ApiResponse({
    status: 200,
    description: "Seller's other products retrieved successfully",
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getSellerOtherProducts(
    @Param('id') id: string,
    @Query('limit') limit: number = 4,
  ) {
    return this.productService.findSellerOtherProducts(id, limit);
  }

  @Get(':id/details')
  @ApiOperation({
    summary: 'Get product with full details including listing ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProductDetails(@Param('id') id: string) {
    return this.productService.findOneWithDetails(id);
  }

  // Image management endpoints
  @Post(':id/images')
  @ApiOperation({
    summary: 'Upload images for product (max 6 images, 10MB each)',
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Too many images or invalid file' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 6))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Additional validation in controller
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Check existing images count
    const existingImages = await this.productService.getProductImagesCount(id);
    const totalImages = existingImages + files.length;

    if (totalImages > 6) {
      throw new BadRequestException(
        `Cannot upload ${files.length} images. Product already has ${existingImages} images. Maximum 6 images allowed per product.`
      );
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new BadRequestException(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`);
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('File size too large. Maximum 10MB per file.');
      }
    }

    return this.productService.uploadProductImages(id, files);
  }

  @Patch(':id/images/:imageId/main')
  @ApiOperation({ summary: 'Set image as main image' })
  @ApiResponse({ status: 200, description: 'Main image set successfully' })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  setMainImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productService.setMainImage(id, imageId);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Delete product image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product or image not found' })
  deleteImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    return this.productService.deleteProductImage(id, imageId);
  }

  @Patch(':id/images/reorder')
  @ApiOperation({ summary: 'Reorder product images' })
  @ApiResponse({ status: 200, description: 'Images reordered successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  reorderImages(@Param('id') id: string, @Body() body: { imageIds: string[] }) {
    return this.productService.reorderImages(id, body.imageIds);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // Engagement tracking endpoints
  @Post(':id/like')
  @ApiOperation({ summary: 'Add like to product' })
  @ApiResponse({ status: 200, description: 'Like added successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addLike(@Param('id') id: string) {
    return this.productService.addLike(id);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Remove like from product' })
  @ApiResponse({ status: 200, description: 'Like removed successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  removeLike(@Param('id') id: string) {
    return this.productService.removeLike(id);
  }

  @Post(':id/call')
  @ApiOperation({ summary: 'Add call to product' })
  @ApiResponse({ status: 200, description: 'Call added successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addCall(@Param('id') id: string) {
    return this.productService.addCall(id);
  }

  @Post(':id/contact')
  @ApiOperation({ summary: 'Add contact to product' })
  @ApiResponse({ status: 200, description: 'Contact added successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addContact(@Param('id') id: string) {
    return this.productService.addContact(id);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({
    status: 200,
    description: 'Product added to favorites successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addToFavorites(@Param('id') id: string) {
    return this.productService.addToFavorites(id);
  }

  @Delete(':id/favorite')
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiResponse({
    status: 200,
    description: 'Product removed from favorites successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  removeFromFavorites(@Param('id') id: string) {
    return this.productService.removeFromFavorites(id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Add share to product' })
  @ApiResponse({ status: 200, description: 'Share added successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addShare(@Param('id') id: string) {
    return this.productService.addShare(id);
  }

  @Post(':id/comment')
  @ApiOperation({ summary: 'Add comment to product' })
  @ApiResponse({ status: 200, description: 'Comment added successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  addComment(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: { comment: string },
  ) {
    return this.productService.addComment(id, req.user.sub, body.comment);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a product' })
  @ApiResponse({ status: 200, description: 'Product reported successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  reportProduct(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: { reason: string },
  ) {
    return this.productService.reportProduct(id, req.user.sub, body.reason);
  }

  @Get(':id/engagement/history')
  @ApiOperation({ summary: 'Get engagement history for a product' })
  @ApiResponse({
    status: 200,
    description: 'Engagement history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getEngagementHistory(@Param('id') id: string) {
    return this.productService.getEngagementHistory(id);
  }

  @Get(':id/engagement/analytics')
  @ApiOperation({ summary: 'Get engagement analytics for a product' })
  @ApiResponse({
    status: 200,
    description: 'Engagement analytics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getEngagementAnalytics(@Param('id') id: string) {
    return this.productService.getEngagementAnalytics(id);
  }

  // Advertising system endpoints
  @Get('promotion/options')
  @ApiOperation({ summary: 'Get promotion options' })
  @ApiResponse({
    status: 200,
    description: 'Promotion options retrieved successfully',
  })
  getPromotionOptions() {
    return this.productService.getPromotionOptions();
  }

  @Post(':id/promote')
  @ApiOperation({ summary: 'Create promotion for product' })
  @ApiResponse({ status: 201, description: 'Promotion created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid promotion type' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  createPromotion(
    @Param('id') id: string,
    @Body() promotionDto: CreatePromotionDto,
  ) {
    return this.productService.createPromotion(id, promotionDto);
  }

  @Delete(':id/promote')
  @ApiOperation({ summary: 'Cancel product promotion' })
  @ApiResponse({ status: 200, description: 'Promotion cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Product is not promoted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  cancelPromotion(@Param('id') id: string) {
    return this.productService.cancelPromotion(id);
  }

  // Draft/Published logic endpoints
  @Get('draft')
  @ApiOperation({ summary: 'Get draft products for current user' })
  @ApiResponse({
    status: 200,
    description: 'Draft products retrieved successfully',
  })
  findDraftProducts(
    @Request() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productService.findDraftProductsByUser(
      req.user.sub,
      paginationDto,
    );
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish a product' })
  @ApiResponse({ status: 200, description: 'Product published successfully' })
  @ApiResponse({ status: 400, description: 'Product is not publishable' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  publishProduct(@Param('id') id: string) {
    return this.productService.publishProduct(id);
  }

  @Post(':id/unpublish')
  @ApiOperation({ summary: 'Unpublish a product (move to draft)' })
  @ApiResponse({ status: 200, description: 'Product unpublished successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  unpublishProduct(@Param('id') id: string) {
    return this.productService.unpublishProduct(id);
  }

  @Get(':id/publishable')
  @ApiOperation({ summary: 'Check if a product is publishable and get issues' })
  @ApiResponse({
    status: 200,
    description: 'Product publishable status retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async checkProductPublishable(@Param('id') id: string) {
    const product = await this.productService.findOne(id);
    const issues = this.productService.checkProductPublishable(product);
    return { publishable: issues.length === 0, issues };
  }

  @Post(':id/submit-for-review')
  @ApiOperation({ summary: 'Submit a product for review' })
  @ApiResponse({
    status: 200,
    description: 'Product submitted for review successfully',
  })
  @ApiResponse({ status: 400, description: 'Product is not publishable' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  submitForReview(@Param('id') id: string) {
    return this.productService.submitForReview(id);
  }

  @Post(':id/approve')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Approve a product (moderator)' })
  @ApiResponse({ status: 200, description: 'Product approved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  approveProduct(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.productService.approveProduct(id, req.user.sub);
  }

  @Post(':id/reject')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Reject a product (moderator)' })
  @ApiResponse({ status: 200, description: 'Product rejected successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  rejectProduct(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: { reason: string },
  ) {
    return this.productService.rejectProduct(id, req.user.sub, body.reason);
  }

  @Get('pending-review')
  @Roles('admin', 'moderator')
  @ApiOperation({ summary: 'Get products pending review (moderator)' })
  @ApiResponse({
    status: 200,
    description: 'Pending review products retrieved successfully',
  })
  getPendingReviewProducts(@Query() paginationDto: PaginationDto) {
    return this.productService.getPendingReviewProducts(paginationDto);
  }

  // Enhanced promotion system endpoints
  @Get('promotion/history')
  @ApiOperation({ summary: 'Get promotion history for current user' })
  @ApiResponse({
    status: 200,
    description: 'Promotion history retrieved successfully',
  })
  getPromotionHistory(@Request() req: RequestWithUser) {
    return this.productService.getPromotionHistory(req.user.sub);
  }

  @Get('promotion/analytics/:id')
  @ApiOperation({ summary: 'Get promotion analytics for a product' })
  @ApiResponse({
    status: 200,
    description: 'Promotion analytics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getPromotionAnalytics(@Param('id') id: string) {
    return this.productService.getPromotionAnalytics(id);
  }

  @Post(':id/promotion/extend')
  @ApiOperation({ summary: 'Extend promotion duration' })
  @ApiResponse({ status: 200, description: 'Promotion extended successfully' })
  @ApiResponse({ status: 400, description: 'Product is not promoted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  extendPromotion(@Param('id') id: string, @Body() body: { days: number }) {
    return this.productService.extendPromotion(id, body.days);
  }

  @Post(':id/promotion/reactivate')
  @ApiOperation({ summary: 'Reactivate expired promotion' })
  @ApiResponse({
    status: 200,
    description: 'Promotion reactivated successfully',
  })
  @ApiResponse({ status: 400, description: 'Product has no promotion history' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  reactivatePromotion(@Param('id') id: string) {
    return this.productService.reactivatePromotion(id);
  }
}
