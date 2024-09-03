module.exports = function(eleventyConfig) {
	eleventyConfig.addPassthroughCopy("src/css");
	eleventyConfig.addPassthroughCopy("src/js");
	eleventyConfig.addPassthroughCopy("src/img");
    eleventyConfig.addPassthroughCopy("src/data");

	// Uncomment if using a custom domain with GitHub Pages
	eleventyConfig.addPassthroughCopy("src/CNAME");
	eleventyConfig.addPassthroughCopy("src/favicon.ico");

	let env = process.env.NODE_ENV;
	let pathPrefixValue = "";

	console.log("Environment: " + env);

	if (env == "prod") {
		pathPrefixValue = "";
	} else {
		pathPrefixValue = "/youth-destination-map/";
	}

	console.log("Path Prefix: " + pathPrefixValue);

	return {
		// Use this pathPrefix if using a custom domain so that 
		// Production builds generate links using the root:
		pathPrefix: pathPrefixValue,
		dir: {
			input: "src",
			output: "docs"
		}
	};
};