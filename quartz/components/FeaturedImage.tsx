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
  position: relative;
  top: 0px;
  left: center;
  width: 100%;
  height: 100%;
  margin-bottom: -130px;
  overflow: hidden;
  z-index: -1;
}
.featured-image {
  display: block;
  width: 100%;
  max-height: 200px;
  height: auto;
  object-fit: cover;
  object-position: 50% 40%;
  border-radius: 8px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.40) 22%, rgba(0, 0, 0, 0.12) 52%, rgba(0, 0, 0, 0) 100%);
  -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 22%, rgba(0, 0, 0, 0.12) 52%, rgba(0, 0, 0, 0) 100%);
}
`

export default (() => FeaturedImage) satisfies QuartzComponentConstructor