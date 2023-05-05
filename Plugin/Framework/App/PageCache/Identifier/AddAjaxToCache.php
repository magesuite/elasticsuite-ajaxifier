<?php

declare(strict_types=1);

namespace MageSuite\ElasticsuiteAjaxifier\Plugin\Framework\App\PageCache\Identifier;

class AddAjaxToCache
{
    protected \Magento\Framework\App\RequestInterface $request;
    protected \Magento\Framework\App\Http\Context $context;
    protected \Magento\Framework\Serialize\Serializer\Json $json;

    public function __construct(
        \Magento\Framework\App\RequestInterface $request,
        \Magento\Framework\App\Http\Context $context,
        \Magento\Framework\Serialize\Serializer\Json $json,
    ) {
        $this->request = $request;
        $this->context = $context;
        $this->json = $json;
    }

    public function afterGetValue(
        \Magento\Framework\App\PageCache\Identifier $subject,
        string $result
    ): string {
        $data = [
            (bool)$this->request->getParam('ajax'),
            $this->request->isSecure(),
            $this->request->getUriString(),
            $this->request->get(\Magento\Framework\App\Response\Http::COOKIE_VARY_STRING)
                ?: $this->context->getVaryString()
        ];

        return sha1($this->json->serialize($data));
    }
}
