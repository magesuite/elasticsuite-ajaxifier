<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Model;

class BlockMapping
{
    protected \Magento\Framework\App\RequestInterface $request;
    protected \Magento\Framework\App\View $view;
    protected array $productListBlockMapping;
    protected array $navBlockMapping;
    protected string $fullActionName;

    public function __construct(
        \Magento\Framework\App\RequestInterface $request,
        \Magento\Framework\App\View $view,
        array $productListBlockMapping = [],
        array $navBlockMapping = []
    ) {
        $this->request = $request;
        $this->view = $view;
        $this->productListBlockMapping = $productListBlockMapping;
        $this->navBlockMapping = $navBlockMapping;
        $this->fullActionName = $request->getFullActionName();
    }

    /**
     * @throws \Exception
     */
    public function getProductListBlock(): \Magento\Framework\View\Element\BlockInterface
    {
        if (array_key_exists($this->fullActionName, $this->productListBlockMapping)) {
            $blockName = $this->productListBlockMapping[$this->fullActionName];

            $block = $this->view->getLayout()->getBlock($blockName);

            if ($block instanceof \Magento\Framework\View\Element\BlockInterface) {
                return $block;
            }
        }

        throw new \Exception(
            "Product block not found for given full action name. Make sure, that it's mapped in di.xml"
        );
    }

    /**
     * @throws \Exception
     */
    public function getNavBlock(): \Magento\Framework\View\Element\BlockInterface
    {
        if (array_key_exists($this->fullActionName, $this->navBlockMapping)) {
            $blockName = $this->navBlockMapping[$this->fullActionName];
            $block = $this->view->getLayout()->getBlock($blockName);
            if ($block instanceof \Magento\Framework\View\Element\BlockInterface) {
                return $block;
            }
        }

        throw new \Exception(
            "Navigation block not found for given full action name. Make sure, that it's mapped in di.xml"
        );
    }
}
