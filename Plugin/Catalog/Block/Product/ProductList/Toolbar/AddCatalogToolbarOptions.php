<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\Catalog\Block\Product\ProductList\Toolbar;

class AddCatalogToolbarOptions
{
    protected \MageSuite\ElasticsuiteAjaxifier\Helper\Configuration $config;
    protected \Magento\Framework\Serialize\Serializer\Json $json;

    public function __construct(
        \MageSuite\ElasticsuiteAjaxifier\Helper\Configuration $config,
        \Magento\Framework\Serialize\Serializer\Json $json
    ) {
        $this->config = $config;
        $this->json = $json;
    }

    public function afterGetWidgetOptionsJson(
        \Magento\Catalog\Block\Product\ProductList\Toolbar $subject,
        string $result,
        array $customOptions = []
    ): string {
        $jsonData = $this->json->unserialize($result);

        if (!isset($jsonData['productListToolbarForm'])) {
            return $result;
        }

        $jsonData['productListToolbarForm']['ajax'] = $this->config->isModuleEnabled();
        return $this->json->serialize($jsonData);
    }
}
