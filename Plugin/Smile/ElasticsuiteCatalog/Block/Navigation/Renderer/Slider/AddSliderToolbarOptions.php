<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\Smile\ElasticsuiteCatalog\Block\Navigation\Renderer\Slider;

class AddSliderToolbarOptions
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

    public function afterGetJsonConfig(
        \Smile\ElasticsuiteCatalog\Block\Navigation\Renderer\Slider $subject,
        $result
    ): string {
        /** @var string[] $jsonData */
        $jsonData = $this->json->unserialize($result);

        if ($jsonData === null) {
            return $result;
        }

        /** @var \Magento\Catalog\Model\Layer\Filter\AbstractFilter $filter */
        $filter = $subject->getFilter();

        $jsonData['requestVar'] = $filter->getRequestVar();
        $jsonData['ajax'] = $this->config->isModuleEnabled();

        return $this->json->serialize($jsonData);
    }
}
