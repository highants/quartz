// quartz/components/FeaturedImage.tsx
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { joinSegments } from "../util/path"

function FeaturedImage({ fileData, cfg, displayClass }: QuartzComponentProps) {
  const socialImage = fileData.frontmatter?.socialImage as string | undefined

  if (socialImage) {
    let imageUrl = socialImage
    if (!socialImage.startsWith("http://") && !socialImage.startsWith("https://")) {
      // 絶対パスもしくは / で始まるパスの場合は cfg.baseUrl (https:// を付与) と連結
      const configuredBaseUrl = cfg.baseUrl
        ? (cfg.baseUrl.startsWith("http") ? cfg.baseUrl : `https://${cfg.baseUrl}`)
        : ""
      imageUrl = joinSegments(configuredBaseUrl, socialImage)
    }

    return (
      <div class={`featured-image-container ${displayClass ?? ""}`}>
        <img
          src={imageUrl}
          alt={fileData.frontmatter?.title ?? "Featured image"}
          class="featured-image"
        />
      </div>
    )
  } else {
    return null
  }
}

// スタイルを追加（オプション）
FeaturedImage.css = `
.featured-image-container {
  width: 100%;
  height: 200px;
  margin-bottom: 0rem;
  overflow: hidden;
}
.featured-image {
  display: block;
  width: 100%;
  max-height: 400px;
  height: auto;
  object-fit: cover;
  object-position: 50% 55%;
  border-radius: 5px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 22%, rgba(0, 0, 0, 0) 45%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.7) 22%, rgba(0, 0, 0, 0) 45%);
}
`

export default (() => FeaturedImage) satisfies QuartzComponentConstructor