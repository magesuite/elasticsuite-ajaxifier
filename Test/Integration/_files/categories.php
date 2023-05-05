<?php
$objectManager = \Magento\TestFramework\Helper\Bootstrap::getObjectManager();

$category = $objectManager->create('Magento\Catalog\Model\Category');
$category->isObjectNew(true);
$category
    ->setId(333)
    ->setCreatedAt('2014-06-23 09:50:07')
    ->setName('Active Category')
    ->setParentId(2)
    ->setPath('1/2/333')
    ->setLevel(3)
    ->setAvailableSortBy('name')
    ->setDefaultSortBy('name')
    ->setIsActive(true)
    ->setPosition(1)
    ->setAvailableSortBy(['position'])
    ->setMetaDescription('Meta description')
    ->save()
    ->reindex();

$rewriteResource = $objectManager->create(\Magento\UrlRewrite\Model\ResourceModel\UrlRewrite::class);

$rewrite = $objectManager->create(\Magento\UrlRewrite\Model\UrlRewrite::class);
$rewrite
    ->setEntityType('category')
    ->setEntityId(333)
    ->setRequestPath('test-category')
    ->setTargetPath('catalog/category/view/id/333')
    ->setRedirectType(0)
    ->setStoreId(1);

$rewriteResource->save($rewrite);
