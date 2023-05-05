<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\ViewModel;

class Link implements \Magento\Framework\View\Element\Block\ArgumentInterface
{
    protected \MageSuite\ElasticsuiteAjaxifier\Model\ProductList $productList;
    protected \Magento\Framework\App\RequestInterface $request;

    public function __construct(
        \MageSuite\ElasticsuiteAjaxifier\Model\ProductList $productList,
        \Magento\Framework\App\RequestInterface $request
    ) {
        $this->productList = $productList;
        $this->request = $request;
    }

    public function getCurrentPage(): int
    {
        return (int)$this->request->getParam('p');
    }

    public function getCurrentUrl(): string
    {
        return $this->request->getOriginalPathInfo();
    }

    public function getMaxNumberOfPages(): int
    {
        return (int)ceil($this->productList->getSize() / $this->productList->getPageSize());
    }
}
