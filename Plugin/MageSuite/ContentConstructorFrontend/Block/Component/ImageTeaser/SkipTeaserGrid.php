<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\MageSuite\ContentConstructorFrontend\Block\Component\ImageTeaser;

class SkipTeaserGrid
{
    protected \MageSuite\ElasticsuiteAjaxifier\Helper\Configuration $configuration;
    protected \Magento\Framework\App\RequestInterface $request;

    public function __construct(
      \MageSuite\ElasticsuiteAjaxifier\Helper\Configuration $configuration,
      \Magento\Framework\App\RequestInterface $request
    ) {
        $this->configuration = $configuration;
        $this->request = $request;
    }

    public function aroundGetData(
        \MageSuite\ContentConstructorFrontend\Block\Component\ImageTeaser $subject,
        callable $proceed,
        $key = '',
        $index = null
    ) {
        if (
            !$this->configuration->isModuleEnabled() ||
            !$this->configuration->isInfiniteScrollEnabled() ||
            !$this->configuration->isTeaserHidingEnabled() ||
            !$this->request->getParam('ajax') ||
            $key != 'grid_teaser'
        ) {
            return $proceed($key, $index);
        }

        return null;
    }
}
