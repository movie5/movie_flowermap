import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, Max, Min } from "class-validator";

export class RequestQueriesFeedDto {

    @ApiProperty({
        description: '정렬 기준 feedId(최신순), heart(좋아요 많은 순)',
        enum: ['feedId', 'heart'],
    })
    @IsIn(['feedId', 'heart'])
    orderBy: 'feedId' | 'heart';

    // @ApiProperty()
    // @IsString()
    // @IsIn(["ASC", "DESC", "asc", "desc"])
    // sort: FindOptionsOrderValue;

    @ApiProperty({
        description: '한번에 가져올 데이터 갯수. 5 ~ 30',
        example: 10
    })
    @Type(() => Number)
    @Min(5)
    @Max(30)
    limit: number;

    @ApiProperty({
        description: `
        스킵할 데이터 갯수. 최소: 0
        ex) 0 -> 처음부터 검색, 5 -> 6번째부터 검색
        `,
        example: 0
    })
    @Type(() => Number)
    @Min(0)
    offset: number;

}