// quartz/components/Head.tsx
import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage" // カスタムOGPプラグイン名をインポート

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    // title: frontmatterがあればそれを使う、なければロケールのデフォルト
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    // description: frontmatterのsocialDescription, description, fileData.descriptionの順で試す
    const description =
      fileData.frontmatter?.socialDescription ?? // OGP/Twitter用
      fileData.frontmatter?.description ??      // 一般的な説明
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description) // ファイルから自動生成された説明

    const { css, js, additionalHead } = externalResources

    // ベースURLとパス関連
    const RbaseUrl = `https://${cfg.baseUrl ?? "example.com"}` // 必ず https:// をつける
    const url = new URL(RbaseUrl)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png") // ファビコンパス

    // 現在のページの完全なURL
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(RbaseUrl, fileData.slug!)

    // --- OGP 画像ロジック ---
    // カスタムOGP画像エミッターが有効かチェック
    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )

    let ogImageUrl: string | null = null // OGP画像のURL
    let ogImageType: string | null = null // OGP画像のMIMEタイプ (e.g., "image/png")

    // カスタムOGP画像生成が *有効でない* 場合のみ、ここでOGP画像を設定する
    if (!usesCustomOgImage) {
        // デフォルトのOGP画像パス
        const defaultOgpImagePath = joinSegments(RbaseUrl, "/static/og-image.png")
        // フロントマターから featured_image を取得
        const featuredImage = fileData.frontmatter?.featured_image as string | undefined

        if (featuredImage) {
          // featured_image のパスを解決 (FeaturedImage.tsx と同様のロジック)
          const imagePath = featuredImage.startsWith("/") ? featuredImage.substring(1) : featuredImage
          const potentialOgImageUrl = joinSegments(RbaseUrl, imagePath) // 絶対URLを生成
          const imageExtension = getFileExtension(potentialOgImageUrl)?.toLowerCase() // 拡張子を取得 (小文字に)

          // サポートされている拡張子か確認 (必要に応じて追加)
          const supportedExtensions = ["png", "jpg", "jpeg", "gif", "webp", "avif"]
          if (imageExtension && supportedExtensions.includes(imageExtension)) {
            ogImageUrl = potentialOgImageUrl
            ogImageType = `image/${imageExtension === 'jpg' ? 'jpeg' : imageExtension}` // jpg は jpeg に
          } else {
              // featured_image が指定されているが無効なパスや拡張子の場合、警告を出し、デフォルトにフォールバック
              console.warn(
                  `[Head] Warning: Invalid featured_image path or unsupported extension for OGP in '${fileData.slug}': "${featuredImage}". Falling back to default OGP image.`
              )
              ogImageUrl = defaultOgpImagePath
              ogImageType = `image/${getFileExtension(defaultOgpImagePath) ?? "png"}`
          }
        } else {
          // featured_image がない場合はデフォルトを使用
          ogImageUrl = defaultOgpImagePath
          ogImageType = `image/${getFileExtension(defaultOgpImagePath) ?? "png"}`
        }
    }
    // --- OGP 画像ロジックここまで ---


    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {/* Google Fonts (設定に応じて) */}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {/* タイトル用フォントが別なら追加 */}
            {cfg.theme.typography.title && cfg.theme.typography.title !== cfg.theme.typography.body && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        {/* 他のpreconnectなど */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* 基本的なOGP/Twitter Cardタグ */}
        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" /> {/* 大きな画像を使うカードタイプ */}
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        {/* 画像がない場合でも、altテキストはdescriptionを使うのが一般的 */}
        <meta property="og:image:alt" content={description} />

        {/* OGP/Twitter 画像タグ (カスタムOGPが有効でない場合のみ) */}
        {!usesCustomOgImage && ogImageUrl && ogImageType && (
          <>
            <meta property="og:image" content={ogImageUrl} />
            <meta property="og:image:url" content={ogImageUrl} /> {/* URLも明示 */}
            <meta name="twitter:image" content={ogImageUrl} />
            <meta property="og:image:type" content={ogImageType} />
            {/* og:image:width と og:image:height を追加したい場合は、
                ビルドプロセス中に画像の寸法を取得する仕組みが必要になります。
                例: <meta property="og:image:width" content="1200" />
                    <meta property="og:image:height" content="630" /> */}
          </>
        )}

        {/* URL関連のタグ (baseUrlが設定されている場合) */}
        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        {/* ファビコン */}
        <link rel="icon" href={iconPath} />
        {/* 通常の description タグ */}
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {/* 外部CSSリソース */}
        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {/* 外部JSリソース (DOMReady前) */}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {/* 追加のHead要素 (プラグインなどから) */}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData) // 関数なら実行結果を挿入
          } else {
            return resource // React要素ならそのまま挿入
          }
        })}
      </head>
    )
  }

  // スタイル定義は不要なので削除
  // Head.css = `...`

  return Head
}) satisfies QuartzComponentConstructor