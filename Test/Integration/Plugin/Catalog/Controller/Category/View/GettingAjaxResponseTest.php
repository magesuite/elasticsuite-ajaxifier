<?php

namespace MageSuite\ElasticsuiteAjaxifier\Test\Integration\Plugin\Catalog\Controller\Category\View;

/**
 * @magentoDbIsolation enabled
 */
class GettingAjaxResponseTest extends \Magento\TestFramework\TestCase\AbstractController
{

    protected ?\Magento\Framework\ObjectManagerInterface $objectManager = null;
    protected ?\Magento\Framework\Serialize\Serializer\Json $json = null;

    public const QUERY = 'shoes';
    public const CUR_PAGE = 1;
    public const PAGE_SIZE = 24;
    public const PRICE_RANGE_MIN = 10;
    public const PRICE_RANGE_MAX = 45;
    public const ORDER_BY = 'name';
    public const ORDER_DIRECTION = 'asc';

    public function setUp(): void
    {
        parent::setUp();
        $this->objectManager = \Magento\TestFramework\ObjectManager::getInstance();
        $this->json = $this->objectManager->create(\Magento\Framework\Serialize\Serializer\Json::class);
    }

    /**
     * @magentoAppArea frontend
     * @magentoDataFixture MageSuite_ElasticsuiteAjaxifier::Test/Integration/_files/categories.php
     * @magentoDataFixture MageSuite_ElasticsuiteAjaxifier::Test/Integration/_files/products.php
     * @magentoDataFixture MageSuite_ElasticsuiteAjaxifier::Test/Integration/_files/full_reindex.php
     */
    public function testSearchPageReturnsCorrectResponse()
    {
        $this->getRequest()->setParams([
            'q' => self::QUERY,
            'p' => self::CUR_PAGE,
            'product_list_limit' => self::PAGE_SIZE,
            'product_list_order' => self::ORDER_BY,
            'product_list_dir' => self::ORDER_DIRECTION,
            'ajax' => 1,
        ]);
        $this->dispatch('catalogsearch/result');
        $response = $this->getResponse()->getBody();
        $response = $this->json->unserialize($response);

        $this->assertIsArray($response, 'The response is not a JSON');
        $this->assertEquals(self::PAGE_SIZE, $response['pageSize'], 'Wrong page size');
        $this->assertEquals(self::CUR_PAGE, $response['curPage'], 'Wrong current page');

        $returnedItems = array_keys($response['returnedItems']);
        $this->assertCount(2, $returnedItems, 'Wrong number of returned items');
        $this->assertEquals(629, $returnedItems[0], 'Wrong order of returned items');
        $this->assertEquals(582, $returnedItems[1], 'Wrong order of returned items');
    }

    /**
     * @magentoAppArea frontend
     * @magentoDataFixture MageSuite_ElasticsuiteAjaxifier::Test/Integration/_files/categories.php
     * @magentoDataFixture MageSuite_ElasticsuiteAjaxifier::Test/Integration/_files/products.php
     * @magentoDataFixture MageSuite_ElasticsuiteAjaxifier::Test/Integration/_files/full_reindex.php
     */
    public function testCategoryPageReturnsCorrectResponse()
    {
        $this->getRequest()->setParams([
            'p' => self::CUR_PAGE,
            'price' => self::PRICE_RANGE_MIN . '-' . self::PRICE_RANGE_MAX,
            'product_list_limit' => self::PAGE_SIZE,
            'product_list_order' => 'price',
            'product_list_dir' => 'desc',
            'ajax' => 1,
        ]);
        $this->dispatch('/test-category');
        $response = $this->getResponse()->getBody();
        $response = $this->json->unserialize($response);

        $this->assertIsArray($response, 'The response is not a JSON');
        $this->assertEquals(self::PAGE_SIZE, $response['pageSize'], 'Wrong page size');
        $this->assertEquals(self::CUR_PAGE, $response['curPage'], 'Wrong current page');

        $returnedItems = array_keys($response['returnedItems']);
        $this->assertCount(2, $returnedItems, 'Wrong number of returned items');
        $this->assertEquals(629, $returnedItems[0], 'Wrong order of returned items');
        $this->assertEquals(733, $returnedItems[1], 'Wrong order of returned items');
    }
}
