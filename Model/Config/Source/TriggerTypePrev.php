<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Model\Config\Source;

class TriggerTypePrev implements \Magento\Framework\Data\OptionSourceInterface
{
    public function toOptionArray(): array
    {
        return [
            ['value' => 'none', 'label' => __('None')],
            ['value' => 'button', 'label' => __('Button')]
        ];
    }
}
