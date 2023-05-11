<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Helper;

class Configuration
{
    public const XML_PATH_IS_MODULE_ENABLED = 'ajaxifier/general/enabled';
    public const XML_PATH_IS_INFINITE_SCROLL_ENABLED = 'ajaxifier/infinite_scroll/enabled';
    public const XML_PATH_INFINITE_SCROLL_MEDIA_BREAKPOINT = 'ajaxifier/infinite_scroll/media_breakpoint';
    public const XML_PATH_INFINITE_SCROLL_TRIGGER_PREV_TYPE = 'ajaxifier/infinite_scroll/trigger_prev_type';
    public const XML_PATH_INFINITE_SCROLL_TRIGGER_PREV_LABEL = 'ajaxifier/infinite_scroll/trigger_prev_label';
    public const XML_PATH_INFINITE_SCROLL_TRIGGER_NEXT_TYPE = 'ajaxifier/infinite_scroll/trigger_next_type';
    public const XML_PATH_INFINITE_SCROLL_TRIGGER_NEXT_LABEL = 'ajaxifier/infinite_scroll/trigger_next_label';
    public const XML_PATH_INFINITE_SCROLL_AUTO_FETCH_NEXT = 'ajaxifier/infinite_scroll/auto_fetch_next';
    public const XML_PATH_INFINITE_SCROLL_AUTO_FETCH_LIMIT = 'ajaxifier/infinite_scroll/auto_fetch_limit';
    public const XML_PATH_INFINITE_SCROLL_NEXT_ITEMS_INDICATOR = 'ajaxifier/infinite_scroll/next_items_indicator';
    public const XML_PATH_INFINITE_SCROLL_NEXT_ITEMS_INDICATOR_LABEL = 'ajaxifier/infinite_scroll/next_items_indicator_label';
    public const XML_PATH_INFINITE_SCROLL_ITEM_SELECTOR = 'ajaxifier/infinite_scroll/item_selector';
    public const XML_PATH_INFINITE_SCROLL_CONTAINER_SELECTOR = 'ajaxifier/infinite_scroll/container_selector';
    public const XML_PATH_INFINITE_SCROLL_TOOLBAR_SELECTOR = 'ajaxifier/infinite_scroll/toolbar_selector';
    public const XML_PATH_INFINITE_SCROLL_OBSERVER_THRESHOLD = 'ajaxifier/infinite_scroll/observer_threshold';
    public const XML_PATH_INFINITE_SCROLL_HIDE_TEASERS = 'ajaxifier/infinite_scroll/hide_teasers';

    protected \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig;

    public function __construct(
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
    ) {
        $this->scopeConfig = $scopeConfig;
    }

    public function getValue(string $path, $store = null): string
    {
        return (string)$this->scopeConfig->getValue(
            $path,
            \Magento\Store\Model\ScopeInterface::SCOPE_STORES,
            $store
        );
    }

    public function isModuleEnabled(): bool
    {
        return (bool)$this->getValue(self::XML_PATH_IS_MODULE_ENABLED);
    }

    public function isInfiniteScrollEnabled(): bool
    {
        return (bool)$this->getValue(self::XML_PATH_IS_INFINITE_SCROLL_ENABLED);
    }

    public function getInitialInfiniteScrollConfig(): array
    {
        return [
            'mediaBreakpoint' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_MEDIA_BREAKPOINT),
            'triggerPrevType' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_TRIGGER_PREV_TYPE),
            'triggerPrevLabel' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_TRIGGER_PREV_LABEL),
            'triggerNextType' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_TRIGGER_NEXT_TYPE),
            'triggerNextLabel' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_TRIGGER_NEXT_LABEL),
            'autoFetchNext' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_AUTO_FETCH_NEXT),
            'autoFetchLimit' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_AUTO_FETCH_LIMIT),
            'nextItemsIndicator' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_NEXT_ITEMS_INDICATOR),
            'nextItemsIndicatorLabel' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_NEXT_ITEMS_INDICATOR_LABEL),
            'itemSelector' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_ITEM_SELECTOR),
            'containerSelector' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_CONTAINER_SELECTOR),
            'toolbarPaginationSelector' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_TOOLBAR_SELECTOR),
            'observerThreshold' => $this->getValue(self::XML_PATH_INFINITE_SCROLL_OBSERVER_THRESHOLD)
        ];
    }

    public function isTeaserHidingEnabled(): bool
    {
        return (bool)$this->getValue(self::XML_PATH_INFINITE_SCROLL_HIDE_TEASERS);
    }
}
