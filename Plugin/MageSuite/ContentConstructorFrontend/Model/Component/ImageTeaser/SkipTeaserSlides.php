<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\MageSuite\ContentConstructorFrontend\Model\Component\ImageTeaser;

class SkipTeaserSlides
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

    public function aroundGetSlides(
        \MageSuite\ContentConstructorFrontend\Model\Component\ImageTeaser $subject,
        callable $proceed
    ): array {
        if (
            !$this->configuration->isModuleEnabled() ||
            !$this->configuration->isInfiniteScrollEnabled() ||
            !$this->configuration->isTeaserHidingEnabled() ||
            !$this->request->getParam('ajax')
        ) {
            return $proceed();
        }

        return [];
    }
}
