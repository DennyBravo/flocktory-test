require.config({
	baseUrl: 'js/lib',
	paths: {
		"app": '/app',
		"components": '/components',
		"react": "react-with-addons.min",
		"JSXTransformer": "JSXTransformer"
	},
	stubModules: ['jsx', 'text', 'JSXTransformer'],
	jsx: {
		fileExtension: '.js'
	}
});

require(['jsx!app/main']);