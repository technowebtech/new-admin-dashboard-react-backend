
    window.onload = function() {
      SwaggerUIBundle({
        url: '/swagger.json',
        dom_id: '#swagger-ui',
        docExpansion: 'none',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 0,
        defaultModelRendering: 'model',
        displayOperationId: false,
        displayRequestDuration: true,
        operationsSorter: 'alpha',
        tagsSorter: 'alpha',
        filter: true,
        tryItOutEnabled: true,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
        showExtensions: true,
        showCommonExtensions: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  