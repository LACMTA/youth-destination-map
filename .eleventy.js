const isProduction = process.env.NODE_ENV === "production";

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/img");
    eleventyConfig.addPassthroughCopy("src/data");

	// Uncomment if using a custom domain with GitHub Pages
	eleventyConfig.addPassthroughCopy("src/CNAME");
	eleventyConfig.addPassthroughCopy("src/favicon.ico");

	return {
		// Use this pathPrefix if using a custom domain so that 
		// Production builds generate links using the root:
		pathPrefix: isProduction ? "" : "/youth-destination-map/",
		dir: {
			input: "src",
			output: "docs"
		}
	};
};