import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";
import { themes as prismThemes } from "prism-react-renderer";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
	title: "Chiyu",
	tagline: "Chiyu learning record",
	favicon: "favicon.svg",

	// Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
	future: {
		v4: true, // Improve compatibility with the upcoming Docusaurus v4
		experimental_faster: true,
	},

	// Set the production url of your site here
	url: "https://imehc.github.io",
	// Set the /<baseUrl>/ pathname under which your site is served
	// For GitHub pages deployment, it is often '/<projectName>/'
	baseUrl: "/chiyu/",

	// GitHub pages deployment config.
	// If you aren't using GitHub pages, you don't need these.
	organizationName: "imehc", // Usually your GitHub org/user name.
	projectName: "chiyu", // Usually your repo name.

	onBrokenLinks: "throw",

	// Even if you don't use internationalization, you can use this field to set
	// useful metadata like html lang. For example, if your site is Chinese, you
	// may want to replace "en" with "zh-Hans".
	i18n: {
		defaultLocale: "zh-Hans",
		locales: ["zh-Hans"],
	},

	plugins: [
		"./src/plugins/tailwind-config.ts",
		"./src/plugins/rspack-config.ts",
		"./src/plugins/cesium-config.ts",
	],

	markdown: {
		mermaid: true,
	},

	themes: [
		"@docusaurus/theme-mermaid",
		[
			"@easyops-cn/docusaurus-search-local",
			{
				hashed: true,
				language: ["zh", "en"],
				indexBlog: true,
				indexPages: true,
				indexDocs: true,
				docsRouteBasePath: "/",
				highlightSearchTermsOnTargetPage: true,
				searchResultLimits: 8,
				searchResultContextMaxLength: 50,
			},
		],
	],

	presets: [
		[
			"classic",
			{
				docs: {
					id: "default",
					path: "docs",
					routeBasePath: "/",
					sidebarPath: "./sidebars.ts",
					showLastUpdateTime: true,
					showLastUpdateAuthor: true,
					// editUrl: 'https://github.com/imehc/three-dimensional/edit/main/',
				},
				blog: {
					path: "blog",
					routeBasePath: "blog",
					showReadingTime: true,
					showLastUpdateTime: false,
					showLastUpdateAuthor: false,
					postsPerPage: 10, // 文章列表分页
					blogSidebarTitle: "最近文章",
					blogSidebarCount: 15,
					onInlineTags: "ignore", // 禁用未定义标签警告
					onUntruncatedBlogPosts: "ignore", // 禁用无截断文章警告
					// editUrl: 'https://github.com/imehc/three-dimensional/edit/main/',
				},
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],

	themeConfig: {
		// Replace with your project's social card
		image: "favicon.svg",
		colorMode: {
			defaultMode: "light",
			respectPrefersColorScheme: true,
			disableSwitch: false,
		},
		navbar: {
			title: "Chiyu",
			hideOnScroll: true,
			logo: {
				alt: "Chiyu Logo",
				src: "favicon.svg",
			},
			items: [
				{
					to: "/blog",
					label: "博客",
					position: "left",
				},
				{
					type: "docSidebar",
					sidebarId: "webSidebar",
					label: "Web",
					position: "left",
				},
			],
		},
		// footer: {
		//   style: 'light',
		//   links: [],
		//   copyright: `Copyright © ${new Date().getFullYear()}. Built with Docusaurus.`,
		// },
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
		},
		liveCodeBlock: {
			playgroundPosition: "bottom",
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
