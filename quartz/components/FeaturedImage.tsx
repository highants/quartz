// quartz/components/FeaturedImage.tsx
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments } from "../util/path" // 必要なユーティリティをインポート

function FeaturedImage({ fileData, cfg, displayClass }: QuartzComponentProps) {
  const featuredImage = fileData.frontmatter?.featured_image as string | undefined

  if (featuredImage) {
    // 画像パスを解決
    // フロントマターのパスは通常、コンテンツルートからの相対パスです
    // cfg.baseUrl を考慮して絶対パスを生成します。
    const imagePath = featuredImage.startsWith("/") ? featuredImage.substring(1) : featuredImage
    const RbaseUrl = cfg.baseUrl?.replace(/\/$/, "") ?? "" // 末尾のスラッシュを削除
    const imageUrl = joinSegments(RbaseUrl, imagePath) // パスを結合

    // もしくは、もし画像が現在のページからの相対パスである場合は resolveRelative を使う
    // const imageUrl = resolveRelative(fileData.slug, featuredImage)

    return (
      <div class={`featured-image-container ${displayClass ?? ""}`}>
        <img
          src={imageUrl}
          alt={fileData.frontmatter?.title ?? "Featured image"} // 代替テキスト（タイトルがあれば使う）
          class="featured-image"
        />
      </div>
    )
  } else {
    // featured_image が指定されていない場合は何も表示しない
    return null
  }
}

// スタイルを追加（オプション）
FeaturedImage.css = `
.featured-image-container {
  width: 100%;
  height: 200px;
  margin-bottom: 0rem; /* 画像とコンテンツの間にスペースを追加 */
  overflow: hidden; /* コンテナからはみ出さないように */
}
.featured-image {
  display: block; /* 余分なスペースを削除 */
  width: 100%;
  max-height: 400px; /* 画像の高さを制限（お好みで調整） */
  height: auto; /* アスペクト比を維持 */
  object-fit: cover; /* コンテナに合わせて画像をトリミング・拡大縮小 */
  object-position: center; /* 中央を基準にトリミング */
  border-radius: 10px; /* 角を少し丸める（オプション） */
　mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0)); /* 上から下に向けてアルファを下げる */
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0)); /* Safari対応 */
}
`

export default (() => FeaturedImage) satisfies QuartzComponentConstructor