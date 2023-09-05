const isProduction = process.env.NODE_ENV === "prod";

module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/img");
    eleventyConfig.addPassthroughCopy("src/data");

	// Uncomment if using a custom domain with GitHub Pages
	// eleventyConfig.addPassthroughCopy("CNAME");

	return {
		// Use this pathPrefix if using a custom domain so that 
		// Production builds generate links using the root:
		// pathPrefix: isProduction ? "" : "/{repository-name}/",
		pathPrefix: "/youth-destination-map/",
		dir: {
			input: "src",
			output: "docs"
		}
	};
};