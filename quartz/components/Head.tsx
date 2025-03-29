// quartz/components/Head.tsx
import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"

export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ?? // socialDescription を優先
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    // ベースURLとパスの準備
    const RbaseUrl = `https://${cfg.baseUrl?.replace(/\/$/, "") ?? "example.com"}` // https:// を追加し、末尾スラッシュを削除
    const url = new URL(RbaseUrl)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png") // baseDir は pathToRoot から取得するため、baseUrl は不要

    // 現在のページの完全なURL
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(RbaseUrl, fileData.slug!)

    // OGP/Twitter Card 画像の決定ロジック
    const featuredImage = fileData.frontmatter?.featured_image as string | undefined
    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = joinSegments(RbaseUrl, "static/og-image.png") // デフォルト画像の絶対URL

    let ogImageUrl = ogImageDefaultPath
    let ogImageType = `image/${getFileExtension(ogImageDefaultPath) ?? "png"}`

    if (featuredImage) {
      // featured_image が指定されている場合、それを最優先
      const imagePath = featuredImage.startsWith("/") ? featuredImage.substring(1) : featuredImage
      ogImageUrl = joinSegments(RbaseUrl, imagePath) // 絶対URLを生成
      ogImageType = `image/${getFileExtension(featuredImage) ?? "png"}`
    }
    // featured_image がなく、カスタムOGイメージエミッターも使わない場合は、デフォルト画像が使われる (ogImageUrlの初期値)

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* 基本的なOGP/Twitter Card情報 */}
        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} /> {/* 代替テキスト */}

        {/*
          OGP/Twitter Card 画像
          1. featured_image があればそれを使用
          2. なければ、カスタムOGイメージエミッターが有効ならエミッターに任せる (ここではタグを出力しない)
          3. どちらでもなければ、デフォルト画像を使用
        */}
        {featuredImage ? (
          // 1. featured_image がある場合
          <>
            <meta property="og:image" content={ogImageUrl} />
            <meta property="og:image:url" content={ogImageUrl} />
            <meta name="twitter:image" content={ogImageUrl} />
            <meta property="og:image:type" content={ogImageType} />
          </>
        ) : !usesCustomOgImage ? (
          // 3. featured_image がなく、カスタムエミッターも使わない場合 (デフォルト画像)
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        ) : (
          // 2. featured_image がなく、カスタムエミッターを使う場合 (タグはエミッターが出力)
          <></>
        )}

        {/* URL関連 */}
        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        {/* その他 */}
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {/* 外部リソース */}
        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  // CSSは変更なし
  // Head.css = `
  // /* 必要であればスタイルを追加 */
  // `

  return Head
}) satisfies QuartzComponentConstructor