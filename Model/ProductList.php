<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Model;

class ProductList
{
    protected \Smile\ElasticsuiteCatalog\Model\ResourceModel\Product\Fulltext\Collection $productCollection;
    protected \Magento\Framework\View\Element\BlockInterface $productListBlock;
    protected \Magento\Framework\View\Element\BlockInterface $navBlock;
    protected BlockMapping $blockMapping;

    protected int $curPage;
    protected int $size;
    protected int $pageSize;
    protected string $html;
    protected string $navBlockHtml;

    public function __construct(
        BlockMapping $blockMapping
    ) {
        $this->blockMapping = $blockMapping;
    }

    public function getProductCollection(): \Smile\ElasticsuiteCatalog\Model\ResourceModel\Product\Fulltext\Collection
    {
        if (isset($this->productCollection)) {
            return $this->productCollection;
        }

        $block = $this->getProductsBlock();
        $this->productCollection = $block->getLayer()->getProductCollection();
        // addToolbarBlock has private visibility,
        // to avoid using mandatory patches to use a magesuite module, using Reflection seems the best approach
        $method = new \ReflectionMethod($block::class, 'addToolbarBlock');
        $method->setAccessible(true);
        $method->invoke($block, $this->productCollection);
        return $this->productCollection;
    }

    public function getProductsBlock(): \Magento\Framework\View\Element\BlockInterface
    {
        if (isset($this->productListBlock)) {
            return $this->productListBlock;
        }

        $this->productListBlock = $this->blockMapping->getProductListBlock();
        return $this->productListBlock;
    }

    public function getSize(): int
    {
        if (!isset($this->size)) {
            $this->size = $this->getProductCollection()->getSize();
        }

        return $this->size;
    }

    public function getPageSize(): int
    {
        if (!isset($this->pageSize)) {
            $this->pageSize = (int)$this->getProductCollection()->getPageSize();
        }

        return $this->pageSize;
    }

    public function getCurPage(): int
    {
        if (!isset($this->curPage)) {
            $this->curPage = $this->getProductCollection()->getCurPage();
        }

        return $this->curPage;
    }

    public function getHtml(): string
    {
        if (!isset($this->html)) {
            $this->html = $this->getProductsBlock()->toHtml();
        }

        return $this->html;
    }

    public function getNavBlockHtml(): string
    {
        if (!isset($this->navBlockHtml)) {
            $this->navBlockHtml = $this->getNavBlock()->toHtml();
        }

        return $this->navBlockHtml;
    }

    protected function getNavBlock(): \Magento\Framework\View\Element\BlockInterface
    {
        if (isset($this->navBlock)) {
            return $this->navBlock;
        }

        $this->navBlock = $this->blockMapping->getNavBlock();
        return $this->navBlock;
    }

    public function getFilterItems(): array
    {
        $items = [];

        foreach ($this->getNavBlock()->getFilters() as $filter) {
            if (!is_a($filter, \Smile\ElasticsuiteCatalog\Model\Layer\Filter\Attribute::class)) {
                continue;
            }

            $datascope = $filter->getRequestVar() . 'Filter';
            $items[$datascope] = [];

            foreach ($filter->getItems() as $item) {
                $items[$datascope][] = $item->toArray(['label', 'count', 'url', 'is_selected']);
            }
        }

        return $items;
    }

    public function getData(): array
    {
        return [
            'productList' => $this->getHtml(),
            'listFilterOptions' => $this->getPageSize(),
            'filterItems' => $this->getFilterItems(),
            'pageSize' => $this->getPageSize(),
            'size' => $this->getSize(),
            'curPage' => $this->getCurPage(),
            'returnedItems' => $this->getProductCollection()->getItems(),
        ];
    }
}
