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
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page
    const socialUrl =
      fileData.slug === "404" ? url.toString() : joinSegments(url.toString(), fileData.slug!)

    // ★★★ 画像ベースURLの定義を修正 ★★★
    // GitHub Pagesの構成に合わせて末尾にスラッシュを追加
    //コンテンツルートからの相対パスを想定
    const imageBaseUrl = joinSegments(cfg.baseUrl ?? "", "content", "_media")

    // ★ デフォルトのOGイメージパスを設定 ★
    const defaultOgImagePath = `https://${cfg.baseUrl ?? "example.com"}/static/og-image.png`

    // ★ featured_image を取得し、絶対URLを生成 ★
    let ogImagePath = defaultOgImagePath // まずデフォルトを設定
    const featuredImageFilename = fileData.frontmatter?.featured_image as string | undefined
    if (featuredImageFilename) {
      // FeaturedImage.tsxと同様に、パスを解決
      const resolvedImagePath = featuredImageFilename.startsWith("/") ? featuredImageFilename.substring(1) : featuredImageFilename
      // 固定ベースURLとファイル名を結合してOGイメージパスを作成
      ogImagePath = joinSegments(url.origin, imageBaseUrl, resolvedImagePath)
    }

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    // ここにあった ogImageDefaultPath の定義は上に移動したので不要

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          // ★ featured_image があればそれを使用し、なければデフォルトを使用 ★
          <>
            <meta property="og:image" content={ogImagePath} />
            <meta property="og:image:url" content={ogImagePath} />
            <meta name="twitter:image" content={ogImagePath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImagePath) ?? "png"}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            // NOTE: additional head fn likely won't have access to the modified `ogImagePath`
            // defined above, as it is scoped to the component, unless passed explicitly.
            // If the fn needs the resolved OG image path, consider refactoring.
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
