<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\Framework\App\View;

class PreventLayoutRenderForAjaxResponse
{
    protected \Magento\Framework\App\RequestInterface $request;

    public function __construct(
        \Magento\Framework\App\RequestInterface $request
    ) {
        $this->request = $request;
    }

    public function aroundRenderLayout(
        \Magento\Framework\App\View $subject,
        \Closure $proceed
    ) {
        if ($this->request->getParam('ajax') && $this->request->getFullActionName() == 'catalogsearch_result_index') {
            return null;
        }

        return $proceed();
    }
}
