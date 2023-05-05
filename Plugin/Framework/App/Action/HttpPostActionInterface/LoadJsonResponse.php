<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\Framework\App\Action\HttpPostActionInterface;

class LoadJsonResponse
{
    protected \MageSuite\ElasticsuiteAjaxifier\Model\ProductList $productList;
    protected \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory;
    protected \Magento\Framework\App\RequestInterface $request;
    protected \Magento\Framework\App\Http\Context $context;

    public function __construct(
        \MageSuite\ElasticsuiteAjaxifier\Model\ProductList $productList,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Magento\Framework\App\RequestInterface $request,
        \Magento\Framework\App\Http\Context $context
    ) {
        $this->productList = $productList;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->request = $request;
        $this->context = $context;
    }

    public function afterExecute(
        \Magento\Framework\App\Action\HttpPostActionInterface $subject,
        $page
    ) {
        if (!$this->request->getParam('ajax')) {
            return $page;
        }

        $productListData = $this->productList->getData();
        $tags = [];

        /**
         * @var \Magento\Catalog\Model\Product $item
         */
        foreach ($productListData['returnedItems'] as $item) {
            $tags = array_merge($tags, $item->getIdentities());
        }

        $subject->getResponse()->setHeader('X-Magento-Tags', implode(',', $tags));
        $this->context->setValue('ajax', true, false);
        return $this->resultJsonFactory->create()->setData($productListData);
    }
}
