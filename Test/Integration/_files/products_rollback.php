<?php

/** @var \Magento\Framework\Registry $registry */
$registry = \Magento\TestFramework\Helper\Bootstrap::getObjectManager()->get(Magento\Framework\Registry::class);

$registry->unregister('isSecureArea');
$registry->register('isSecureArea', true);
$productRepository = \Magento\TestFramework\Helper\Bootstrap::getObjectManager()->get(\Magento\Catalog\Api\ProductRepositoryInterface::class);

foreach (['running_shoes_66', 'climbing_shoes_22', 'yoga_pants_98'] as $sku) {
    $product = $productRepository->get($sku);

    if ($product->getId()) {
        $product->delete();
    }
}
