import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, Query, HttpCode, Ip, ParseIntPipe } from '@nestjs/common';
import { FeedsService } from './feeds.service';
import { CreateFeedDto } from './dto/create-feed.dto';
import { UpdateFeedDto } from './dto/update-feed.dto';
import { ApiBadRequestResponse, ApiBody, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ResponseFeedDto } from './dto/response-feed.dto';
import { ResponsePageDto } from 'src/common/response-page.dto';
import { Feed } from './entities/feed.entity';
import { SimpleResponseFeedDto } from './dto/simple-response-feed.dto';
import { SingleResponseDto } from 'src/common/single-response.dto';
import { Image } from '../images/entities/image.entity';
import { LocationsService } from '../locations/locations.service';
import { CustomErrorCode } from 'src/common/exception/custom-error-code';
import { ImagesService } from '../images/images.service';
import { PasswordDto } from './dto/password.dto';

// API 문서
@ApiTags('Feed(게시글) API')
@ApiBadRequestResponse({ description: `잘못된 요청 형식입니다. (body, query, param 등) [errorCode=${CustomErrorCode.VALIDATION_BAD_REQUEST}]` })

@Controller('api/v1/feeds')
export class FeedsController {
  constructor(
    private readonly feedsService: FeedsService,
    private readonly locationsService: LocationsService,
    private readonly imagesService: ImagesService,
  ) { }

  // API 문서
  @ApiOperation({
    summary: 'Feed 생성', description: `
    Feed 생성을 위한 API 입니다.
    Image표시 순서는 입력 순서대로 설정됩니다.
  ` })
  @ApiBody({ type: CreateFeedDto })
  @ApiCreatedResponse({ description: '요청 성공', type: SingleResponseDto })
  @ApiNotFoundResponse({ description: `Image, Location이 존재하지 않습니다. [errorCode=${CustomErrorCode.IMAGE_NOT_FOUND} or ${CustomErrorCode.LOCATION_NOT_FOUND}]` })

  @Post()
  async create(
    @Body() createFeedDto: CreateFeedDto,
    @Ip() userIp: string): Promise<SingleResponseDto> {

    // Location 존재 여부 확인
    await this.locationsService.existsById(createFeedDto.locationId);
    // Image 존재 여부 및 사용 가능 여부 확인
    await this.imagesService.isUsableImages(createFeedDto.imageIds);
    // IP주소 설정
    createFeedDto.userIp = userIp;
    // Feed 생성
    const feed: Feed = await this.feedsService.create(createFeedDto.toEntity());

    return new SingleResponseDto('Feed', feed.feedId);
  }

  @Get()
  @ApiOperation({ summary: 'Feed 검색 (미완)', description: 'Feed 검색을 위한 API 입니다.' })
  @ApiOkResponse({ description: '요청 성공', type: ResponsePageDto<SimpleResponseFeedDto> })
  findAll(
    @Query('query') query: string,
    @Query('sort') sort: 'ASC' | 'DESC',
    @Query('limit') limit: number,
    @Query('offset') offset: number) {
    const data = [];
    for (let index = 0; index < limit; index++) {
      const feed = new Feed();
      feed.feedId = index + 1;
      feed.capturedAt = new Date();
      feed.floweringStatus = Math.floor(Math.random() * 5) + 1;
      const image = new Image()
      image.originUrl = 'https://item.kakaocdn.net/do/71b0683bd1963c4e24c8ba605e23bac9617ea012db208c18f6e83b1a90a7baa7';
      image.thumbUrl = 'https://item.kakaocdn.net/do/ffd6fd4ddd308f7b129cf04c5ca71ada617ea012db208c18f6e83b1a90a7baa7';
      feed.addImage(image);

      data[index] = new SimpleResponseFeedDto(feed);
    }
    return new ResponsePageDto<SimpleResponseFeedDto>(1000, offset, limit, data);
    // return this.feedsService.findAll();
  }

  // API 문서
  @ApiOperation({ summary: 'Feed 단건 조회', description: '특정 Feed의 상세정보를 조회합니다.' })
  @ApiOkResponse({ description: '요청 성공', type: ResponseFeedDto })
  @ApiNotFoundResponse({ description: `요청하신 Feed가 존재하지 않습니다. [errorCode=${CustomErrorCode.FEED_NOT_FOUND}]` })

  @Get(':feedId')
  async findOne(@Param('feedId', ParseIntPipe) feedId: number): Promise<ResponseFeedDto> {
    return new ResponseFeedDto(await this.feedsService.findOne(feedId));
  }

  @Patch(':feedId')
  @ApiOperation({ summary: 'Feed 수정 (미완)', description: '특정 Feed의 정보를 수정합니다.<br>수정을 원하는 값만 보내면 됩니다.<br>@비밀번호 변경 여부 논의 필요<br>password : 비밀번호 확인을 위해 필수' })
  @ApiOkResponse({ description: '요청 성공', type: SingleResponseDto })
  @ApiNotFoundResponse({ description: '요청하신 Feed가 존재하지 않습니다.' })
  @ApiUnauthorizedResponse({ description: '잘못된 비밀번호' })
  update(@Param('feedId') feedId: number,
    @Body() updateFeedDto: UpdateFeedDto) {
    return new SingleResponseDto('Feed', feedId)
    // return this.feedsService.update(feedId, updateFeedDto);
  }

  // API 문서화
  @ApiOperation({ summary: 'Feed 삭제', description: '특정 Feed를 삭제합니다.' })
  @ApiBody({ type: PasswordDto })
  @ApiNoContentResponse({ description: '요청 성공' })
  @ApiNotFoundResponse({ description: `요청하신 Feed가 존재하지 않습니다. [errorCode=${CustomErrorCode.FEED_NOT_FOUND}]` })
  @ApiUnauthorizedResponse({ description: `잘못된 비밀번호 [errorCode=${CustomErrorCode.FEED_UNAUTHORIZED}]` })

  @Delete(':feedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('feedId', ParseIntPipe) feedId: number,
    @Body() passwordDto: PasswordDto): Promise<void> {
    await this.feedsService.remove(feedId, passwordDto.password);
    return;
  }
}
