<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Model\Config\Source;

class TriggerTypeNext implements \Magento\Framework\Data\OptionSourceInterface
{
    public function toOptionArray(): array
    {
        return [
            ['value' => 'none', 'label' => __('None')],
            ['value' => 'button', 'label' => __('Button')],
            ['value' => 'product_tile', 'label' => __('Product Tile')]
        ];
    }
}
