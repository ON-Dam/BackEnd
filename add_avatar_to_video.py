import ffmpeg


def video_add(base_video, avatar, output_file='output_video.mp4'):  # 기본 동영상과 아바타 이미지 매개변수

    try:
        # 매개 변수가 경로일 때 쓰는 코드. 미리 ffmpeg-python 스트림 객체면 필요 없음.
        base_video = ffmpeg.input(base_video)
        avatar = ffmpeg.input(avatar)

        avatar = avatar.filter('scale', 500, 500)  # 아바타 영상 크기 바꿔야 할 때때

        video_with_avatar = ffmpeg.overlay(
            base_video, avatar, x='main_w-overlay_w-10', y='main_h-overlay_h-10')

        # 결과 동영상 파일 출력
        ffmpeg.output(video_with_avatar, output_file).run()
        print(f"Output saved to {output_file}")
    except ffmpeg.Error as e:
        print("An error occurred:", e)

# 터미널 명령어
# ffmpeg - i base_video.mp4 - i avatar.png - filter_complex "[1:v] scale=100:100 [avatar]; [0:v][avatar] overlay=main_w-overlay_w-10:main_h-overlay_h-10" output_video.mp4


video_add('home.mp4', 'avatar.mp4')
