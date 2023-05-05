<?php
$registry = \Magento\TestFramework\Helper\Bootstrap::getObjectManager()->get('Magento\Framework\Registry');

$registry->unregister('isSecureArea');
$registry->register('isSecureArea', true);

foreach ([333] as $categoryId) {
    $category = \Magento\TestFramework\Helper\Bootstrap::getObjectManager()->create('Magento\Catalog\Model\Category');
    $category->load($categoryId);

    if ($category->getId()) {
        $category->delete();
    }
}
