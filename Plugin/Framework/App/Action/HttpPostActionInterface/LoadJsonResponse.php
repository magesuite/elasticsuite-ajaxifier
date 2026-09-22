<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\Framework\App\Action\HttpPostActionInterface;

class LoadJsonResponse
{
    public const AJAX_PARAM = 'ajax';

    public function __construct(
        protected \MageSuite\ElasticsuiteAjaxifier\Model\ProductList $productList,
        protected \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        protected \Magento\Framework\App\RequestInterface $request,
        protected \Magento\Framework\App\Http\Context $context
    ) {
    }

    public function afterExecute(
        \Magento\Framework\App\Action\HttpPostActionInterface $subject,
        $page
    ) {
        if (!$this->request->getParam(self::AJAX_PARAM)) {
            return $page;
        }

        $this->cleanRequestUri();
        $productListData = $this->productList->getData();
        $this->request->setRequestUri(null);

        $identities = [];

        /**
         * @var \Magento\Catalog\Model\Product $item
         */
        foreach ($productListData['returnedItems'] as $item) {
            $identities[] = $item->getIdentities();
        }

        $tags = array_unique(array_merge([], ...$identities));

        $subject->getResponse()->setHeader('X-Magento-Tags', implode(',', $tags));
        $this->context->setValue(self::AJAX_PARAM, true, false);

        return $this->resultJsonFactory->create()->setData($productListData);
    }

    /**
     * Removes `ajax` param from request uri to avoid redirects to json page from generated UENC
     */
    protected function cleanRequestUri(): void
    {
        $requestUri = $this->request->getRequestUri();
        $parts = parse_url($requestUri); // phpcs:ignore
        parse_str($parts['query'] ?? '', $query); // phpcs:ignore

        unset($query[self::AJAX_PARAM]);

        $requestUri = $parts['path'] . ($query ? '?' . http_build_query($query) : '');
        $this->request->setRequestUri($requestUri);
    }
}
