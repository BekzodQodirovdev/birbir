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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ProfessionalApplicationDto } from './dto/professional-application.dto';
import { ContactPreferencesDto } from './dto/contact-preferences.dto';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { Roles } from 'src/common/decorator/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    sub: string;
    role: string;
  };
}

@ApiTags('Users')
@Controller('users')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all active users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll() {
    return this.userService.findAll();
  }

  @Get('by-role')
  @Roles('admin')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findByRole(@Query('role') role: string) {
    return this.userService.findByRole(role);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  getProfile(@Request() req: RequestWithUser) {
    return this.userService.findOne(req.user.sub);
  }

  @Get('profile/stats')
  @ApiOperation({ summary: 'Get current user profile statistics' })
  @ApiResponse({
    status: 200,
    description: 'User profile statistics retrieved successfully',
  })
  getProfileStats(@Request() req: RequestWithUser) {
    return this.userService.getProfileStats(req.user.sub);
  }

  @Get('profile/engagement/analytics')
  @ApiOperation({ summary: 'Get current user engagement analytics' })
  @ApiResponse({
    status: 200,
    description: 'User engagement analytics retrieved successfully',
  })
  getUserEngagementAnalytics(@Request() req: RequestWithUser) {
    return this.userService.getUserEngagementAnalytics(req.user.sub);
  }

  @Get('profile/contact-preferences')
  @ApiOperation({ summary: 'Get current user contact preferences' })
  @ApiResponse({
    status: 200,
    description: 'Contact preferences retrieved successfully',
  })
  getContactPreferences(@Request() req: RequestWithUser) {
    return this.userService.getContactPreferences(req.user.sub);
  }

  @Patch('profile/contact-preferences')
  @ApiOperation({ summary: 'Update current user contact preferences' })
  @ApiResponse({
    status: 200,
    description: 'Contact preferences updated successfully',
  })
  updateContactPreferences(
    @Request() req: RequestWithUser,
    @Body() preferencesDto: ContactPreferencesDto,
  ) {
    return this.userService.updateContactPreferences(
      req.user.sub,
      preferencesDto,
    );
  }

  @Get('profile/professional-application')
  @ApiOperation({ summary: 'Get current user professional application' })
  @ApiResponse({
    status: 200,
    description: 'Professional application retrieved successfully',
  })
  getProfessionalApplication(@Request() req: RequestWithUser) {
    return this.userService.getProfessionalApplication(req.user.sub);
  }

  @Post('profile/professional-application')
  @ApiOperation({ summary: 'Submit professional seller application' })
  @ApiResponse({
    status: 201,
    description: 'Professional application submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Application already submitted' })
  submitProfessionalApplication(
    @Request() req: RequestWithUser,
    @Body() applicationDto: ProfessionalApplicationDto,
  ) {
    return this.userService.submitProfessionalApplication(
      req.user.sub,
      applicationDto,
    );
  }

  // @Roles('admin')
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/activate')
  @Roles('admin')
  @ApiOperation({ summary: 'Activate a user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  activate(@Param('id') id: string) {
    return this.userService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  deactivate(@Param('id') id: string) {
    return this.userService.deactivate(id);
  }

  @Patch(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({ status: 200, description: 'User role changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid role' })
  @ApiResponse({ status: 404, description: 'User not found' })
  changeRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.userService.changeRole(id, body.role);
  }

  @Patch(':id/verify')
  @Roles('admin')
  @ApiOperation({ summary: 'Verify a user' })
  @ApiResponse({ status: 200, description: 'User verified successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  verifyUser(@Param('id') id: string) {
    return this.userService.verifyUser(id);
  }

  @Post(':id/rating')
  @ApiOperation({ summary: 'Add rating to user' })
  @ApiResponse({ status: 200, description: 'Rating added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid rating' })
  @ApiResponse({ status: 404, description: 'User not found' })
  addRating(@Param('id') id: string, @Body() body: { rating: number }) {
    return this.userService.addRating(id, body.rating);
  }

  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Subscribe to user' })
  @ApiResponse({ status: 200, description: 'Subscribed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  subscribe(@Param('id') id: string) {
    return this.userService.addSubscriber(id);
  }

  @Delete(':id/subscribe')
  @ApiOperation({ summary: 'Unsubscribe from user' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  unsubscribe(@Param('id') id: string) {
    return this.userService.removeSubscriber(id);
  }

  // Admin endpoints for professional applications
  @Get('admin/professional-sellers')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all professional sellers' })
  @ApiResponse({
    status: 200,
    description: 'Professional sellers retrieved successfully',
  })
  getProfessionalSellers() {
    return this.userService.getProfessionalSellers();
  }

  @Get('admin/pending-applications')
  @Roles('admin')
  @ApiOperation({ summary: 'Get all pending professional applications' })
  @ApiResponse({
    status: 200,
    description: 'Pending applications retrieved successfully',
  })
  getPendingApplications() {
    return this.userService.getPendingApplications();
  }

  @Patch('admin/:id/approve-application')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve professional application' })
  @ApiResponse({
    status: 200,
    description: 'Application approved successfully',
  })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  @ApiResponse({ status: 404, description: 'User not found' })
  approveProfessionalApplication(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.userService.approveProfessionalApplication(id, req.user.sub);
  }

  @Patch('admin/:id/reject-application')
  @Roles('admin')
  @ApiOperation({ summary: 'Reject professional application' })
  @ApiResponse({
    status: 200,
    description: 'Application rejected successfully',
  })
  @ApiResponse({ status: 400, description: 'Application is not pending' })
  @ApiResponse({ status: 404, description: 'User not found' })
  rejectProfessionalApplication(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: { reason: string },
  ) {
    return this.userService.rejectProfessionalApplication(
      id,
      req.user.sub,
      body.reason,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // Moderator endpoints for user complaints
  @Post(':id/report')
  @Roles('user', 'moderator', 'admin')
  @ApiOperation({ summary: 'Report a user' })
  @ApiResponse({ status: 200, description: 'User reported successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  reportUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: { reason: string; description: string },
  ) {
    return this.userService.reportUser(
      id,
      req.user.sub,
      body.reason,
      body.description,
    );
  }

  @Get('moderator/reports')
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Get all user reports (moderator)' })
  @ApiResponse({
    status: 200,
    description: 'User reports retrieved successfully',
  })
  getAllUserReports(@Query() paginationDto: any) {
    return this.userService.getAllUserReports(paginationDto);
  }

  @Patch('moderator/:id/ban')
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Ban a user (moderator)' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  banUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() body: { reason: string; duration?: number },
  ) {
    return this.userService.banUser(
      id,
      req.user.sub,
      body.reason,
      body.duration,
    );
  }

  @Patch('moderator/:id/unban')
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Unban a user (moderator)' })
  @ApiResponse({ status: 200, description: 'User unbanned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  unbanUser(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.userService.unbanUser(id, req.user.sub);
  }

  @Get('moderator/:id/reports')
  @Roles('moderator', 'admin')
  @ApiOperation({ summary: 'Get reports for a specific user (moderator)' })
  @ApiResponse({
    status: 200,
    description: 'User reports retrieved successfully',
  })
  getUserReports(@Param('id') id: string, @Query() paginationDto: any) {
    return this.userService.getUserReports(id, paginationDto);
  }
}
