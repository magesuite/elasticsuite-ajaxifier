<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\ViewModel;

class Init implements \Magento\Framework\View\Element\Block\ArgumentInterface
{
    protected \Magento\Framework\Serialize\Serializer\Json $json;
    protected \MageSuite\ElasticsuiteAjaxifier\Model\ProductList $productList;
    protected \MageSuite\ElasticsuiteAjaxifier\Helper\Configuration $config;

    public function __construct(
        \Magento\Framework\Serialize\Serializer\Json $json,
        \MageSuite\ElasticsuiteAjaxifier\Helper\Configuration $config,
        \MageSuite\ElasticsuiteAjaxifier\Model\ProductList $productList
    ) {
        $this->json = $json;
        $this->config = $config;
        $this->productList = $productList;
    }

    public function getInitDataForJS(): string
    {
        return $this->json->serialize([
            'items' => [
                'pageSize' => $this->productList->getPageSize(),
                'size' => $this->productList->getSize(),
                'curPage' => $this->productList->getCurPage(),
            ],
            'infinite' => $this->config->getInitialInfiniteScrollConfig()
        ]);
    }
}
