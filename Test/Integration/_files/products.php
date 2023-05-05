<?php
$objectManager = \Magento\TestFramework\Helper\Bootstrap::getObjectManager();
$categoryLinkRepository = $objectManager->get('\Magento\Catalog\Api\CategoryLinkManagementInterface');

$products = [
    [
        'id' => 582,
        'name' => 'Running shoes',
        'sku' => 'running_shoes_66',
        'price' => 50,
    ],
    [
        'id' => 629,
        'name' => 'Climbing shoes',
        'sku' => 'climbing_shoes_22',
        'price' => 44,
    ],
    [
        'id' => 733,
        'name' => 'Yoga pants',
        'sku' => 'yoga_pants_98',
        'price' => 12,
    ],
];

foreach ($products as $productData) {
    $product = $objectManager->create(\Magento\Catalog\Model\Product::class);
    $product->setTypeId(\Magento\Catalog\Model\Product\Type::TYPE_SIMPLE)
        ->setId($productData['id'])
        ->setAttributeSetId(4)
        ->setName($productData['name'])
        ->setSku($productData['sku'])
        ->setPrice($productData['price'])
        ->setVisibility(\Magento\Catalog\Model\Product\Visibility::VISIBILITY_BOTH)
        ->setStatus(\Magento\Catalog\Model\Product\Attribute\Source\Status::STATUS_ENABLED)
        ->setWebsiteIds([1])
        ->setStoreIds([1])
        ->setStockData(['use_config_manage_stock' => 1, 'qty' => 100, 'is_qty_decimal' => 0, 'is_in_stock' => 1])
        ->setCanSaveCustomOptions(true)
        ->setDescription('<p>Description</p>')
        ->save();

    $product->reindex();
    $product->priceReindexCallback();
    $categoryLinkRepository->assignProductToCategories($productData['sku'], [333]);
}
