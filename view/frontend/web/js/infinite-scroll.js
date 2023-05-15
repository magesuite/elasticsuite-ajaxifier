define([
    'jquery',
    'matchMedia',
    'mage/translate',
    'mage/url',
    'mgsElasticsuiteInteractionElement',
    'text!MageSuite_ElasticsuiteAjaxifier/template/button.html',
    'text!MageSuite_ElasticsuiteAjaxifier/template/indicator.html',
    'text!MageSuite_ElasticsuiteAjaxifier/template/observable_area.html',
    'text!MageSuite_ElasticsuiteAjaxifier/template/product_tile.html'
], function ($, mediaCheck, $t, url, InteractionElement, buttonTpl, indicatorTpl, observableAreaTpl, productTileTpl) {
    'use strict';

    /**
     * How does it work:
     * -> Options are parsed to correct types
     * -> Depending on media breakpoint, _create runs _toggleInfiniteScroll which:
     *    -> Initializes Intersection Observer
     *    -> Initializes InteractionElements (observer areas, buttons, fake product tiles).
     *       InteractionElements are wrappers for HTML elements with their own methods.
     * -> When user clicks on trigger (button, product tile), _clickHandler fires _loadPage.
     * -> When users scrolls to the end of listing, this.observer fires _loadPage.
     * -> _loadPage fetches new products, passes them to _afterPageLoad.
     * -> _afterPageLoad puts response to listing and triggers _updateInteractionElements.
     * -> _updateInteractionElements sets new urls and/or removes unnecessary elements.
     */
    $.widget('mgs.elasticsuiteInfiniteScroll', {
        options: {
            infinite: {
                mediaBreakpoint: false,
                triggerPrevType: 'none',
                triggerPrevLabel: $t('Previous items'),
                triggerNextType: 'none',
                triggerNextLabel: $t('Next items'),
                triggerButtonArrowUrl: 'images/icons/button/icon-default-primary.svg',
                nextItemsIndicator: false,
                nextItemsIndicatorLabel: $t('Showing %c from %t products'),
                autoFetchNext: true,
                autoFetchLimit: 0,
                observerThreshold: 100,
                loadingTriggerLabel: $t('Loading'),
                itemSelector: '.cs-grid-layout__brick:not(.cs-grid-layout__brick--teaser)',
                containerSelector: '.products.list.items',
                toolbarPaginationSelector: '.cs-toolbar__item--pagination',
                productTileTriggerClassName: 'cs-infinite-scroll__brick',
            },
            items: {
                size: 0,
                pageSize: 0,
                curPage: 0,
                lowestPage: 1,
                highestPage: 1,
            }
        },
        DIRECTIONS: {
            prev: 'prev',
            next: 'next'
        },
        DATA_ATTRIBUTES: {
            dataUrl: 'data-url',
            dataDirection: 'data-direction'
        },
        TRIGGER_TYPES: {
            none: 'none',
            button: 'button',
            productTile: 'product_tile'
        },
        ajaxInProgress: false,
        current_href: null,
        loadedItems: null,
        observer: null,
        autoFetchCount: 0,
        interactionElements: [],
        $container: null,
        toolbarElement: null,

        _create: function () {
            if (this.options.items.size === 0) {
                return;
            }

            this._parseOptions();
            this.options.items.lowestPage = this.options.items.highestPage = this.options.items.curPage;
            this.$container = $(this.options.infinite.containerSelector);
            this.current_href = window.location.href;
            this.$toolbarElement = $(this.options.infinite.toolbarPaginationSelector);

            this._attachEventListeners();
        },

        /**
         * @inheritDoc
         * @private
         */
        _init: function () {
            this._super();

            /**
             * Scrolls page to last visited tile
             */
            if (history.state && history.state.scrollTo) {
                history.scrollRestoration = 'manual';
                document.querySelector(`a[href="${history.state.scrollTo}"]`).scrollIntoView();
            }

            if (this.options.infinite.mediaBreakpoint) {
                mediaCheck({
                    media: this.options.infinite.mediaBreakpoint,
                    entry: $.proxy(function () {
                        this._toggleInfiniteScroll(true);
                    }, this),
                    exit: $.proxy(function () {
                        this._toggleInfiniteScroll(false);
                    }, this)
                });
            } else {
                this._toggleInfiniteScroll(true);
            }
        },

        _attachEventListeners: function () {
            /**
             * Saves last clicked item link in history.state
             */
            $('body').on('click', this.options.infinite.itemSelector, function(event)  {
                const href = $(event.currentTarget).find('a').attr('href');
                history.replaceState({scrollTo: href}, document.title, this.current_href);
            });
        },

        /**
         * Turns on/off infinite scroll
         * @param status{boolean}
         * @private
         */
        _toggleInfiniteScroll: function (status) {
            if (status) {
                if (!this.observer && this.options.infinite.autoFetchNext && this.options.infinite.autoFetchLimit > this.autoFetchCount) {
                    this._initIntersectionObserver();
                }

                if (this.interactionElements.length) {
                    this._toggleVisibility(true);
                    this._addListeners();
                } else {
                    this._initInteractionElements();
                }

                this.$toolbarElement.hide();
            } else {
                if (this.interactionElements.length) {
                    this._toggleVisibility(false);
                    this._removeListeners();
                }
                this.$toolbarElement.show();
            }
        },

        /**
         * Options come from admin panel, so here they're parsed to correct types.
         * @private
         */
        _parseOptions: function () {
            this.options.infinite.nextItemsIndicator = parseInt(this.options.infinite.nextItemsIndicator);
            this.options.infinite.observerThreshold = parseInt(this.options.infinite.observerThreshold);
            this.options.infinite.autoFetchPrev = parseInt(this.options.infinite.autoFetchPrev);
            this.options.infinite.autoFetchNext = parseInt(this.options.infinite.autoFetchNext);
            this.options.infinite.autoFetchLimit = parseInt(this.options.infinite.autoFetchLimit);

            if (this.options.infinite.autoFetchLimit === 0) {
                this.options.infinite.autoFetchLimit = Infinity
            }

            if (this.options.infinite.mediaBreakpoint === '0') {
                this.options.infinite.mediaBreakpoint = false;
            }
        },

        /**
         * Sets loading indicators in InteractionElements
         * @param isLoading {boolean}
         * @param direction {string}
         * @private
         */
        _setLoading: function (isLoading, direction) {
            if (this.interactionElements.length) {
                this.interactionElements.forEach(element => {
                    if (element.direction === direction) {
                        element.setLoading(isLoading);
                    }
                })
            }
        },

        /**
         * Sets InteractionElements visibility.
         * If direction is omitted all InteractionElementss will be affected.
         * @param isVisible {boolean}
         * @param direction {string | undefined}
         * @private
         */
        _toggleVisibility: function (isVisible, direction) {
            if (this.interactionElements.length) {
                this.interactionElements.forEach(interactionElement => {
                    if (typeof direction === 'undefined' || interactionElement.direction === direction) {
                        interactionElement.toggleVisibility(isVisible);
                    }
                })
            }
        },

        /**
         * Updates InteractionElements (in most cases updates urls).
         * @param url
         * @param direction
         * @private
         */
        _updateInteractionElement: function (url, direction) {
            if (this.interactionElements.length) {
                this.interactionElements.forEach(interactionElement => {
                    interactionElement.update(url, direction);
                })
            }
        },

        /**
         * Attaches ui elements listeners.
         * If direction is ommited all elments will be affected.
         * @param direction
         * @private
         */
        _addListeners: function (direction) {
            if (this.interactionElements.length) {
                this.interactionElements.forEach(interactionElement => {
                    if (typeof direction === 'undefined') {
                        interactionElement.addListeners();
                    } else if (interactionElement.direction === direction) {
                        interactionElement.addListeners();
                    }
                })
            }
        },

        /**
         * Detaches InteractionElements listeners.
         * If direction is omitted all elements will be affected.
         * @param direction
         * @private
         */
        _removeListeners: function (direction) {
            if (this.interactionElements.length) {
                this.interactionElements.forEach(interactionElement => {
                    if (typeof direction === 'undefined') {
                        interactionElement.removeListeners();
                    } else if (interactionElement.direction === direction) {
                        interactionElement.removeListeners();
                    }
                })
            }
        },

        /**
         * Removes HTML element & element itself. Direction is required.
         * @param direction
         * @private
         */
        _removeInteractionElements: function (direction) {
            if (this.interactionElements.length && direction) {
                this.interactionElements = this.interactionElements.filter((interactionElement) => {
                    if (interactionElement.direction === direction) {
                        return interactionElement.remove();
                    } else {
                        return true
                    }
                })
            }
        },

        /**
         * Initializes Intersection Observer
         * @private
         */
        _initIntersectionObserver: function () {
            this.observer = new IntersectionObserver(
                (entries) =>
                    entries.forEach((entry, observer) => {
                        if (!this.ajaxInProgress && entry.isIntersecting) {
                            const {target} = entry;

                            if (this.autoFetchCount < this.options.infinite.autoFetchLimit) {
                                this._setLoading(true, target.getAttribute(this.DATA_ATTRIBUTES.dataDirection));
                                this._loadPage(target.getAttribute(this.DATA_ATTRIBUTES.dataUrl));
                                this.autoFetchCount++
                            } else {
                                this.observer.unobserve(target);
                            }
                        }
                    }),
                {
                    rootMargin: `${this.options.infinite.observerThreshold}px`,
                }
            );
        },

        /**
         * Button / Product tile click handler
         * @param currentTarget
         * @private
         */
        _clickHandler: function ({currentTarget}) {
            const direction = currentTarget.getAttribute(this.DATA_ATTRIBUTES.dataDirection);

            this._setLoading(true, direction);
            this._loadPage(currentTarget.getAttribute(this.DATA_ATTRIBUTES.dataUrl));
        },

        /**
         * Creates observers & triggers based on this.options.infinite configuration.
         * InteractionElements are saved in this.interactionElements array.
         * @private
         */
        _initInteractionElements: function () {
            // Prev
            if (this.options.items.lowestPage > 1) {
                const prevUrl = this._buildUrl(this.current_href, 'p', parseInt(this.options.items.curPage) - 1);

                // Trigger
                if (this.options.infinite.triggerPrevType !== this.TRIGGER_TYPES.none) {
                    const prevTriggerElement = new InteractionElement({
                        url: prevUrl,
                        caption: this.options.infinite.triggerPrevLabel,
                        type: this.options.infinite.triggerPrevType,
                        direction: this.DIRECTIONS.prev,
                        loadingCaption: this.options.infinite.loadingTriggerLabel,
                        clickHandler: this._clickHandler.bind(this),
                        pageData: this.options.items,
                        arrow: this.options.infinite.triggerButtonArrowUrl ? require.toUrl(this.options.infinite.triggerButtonArrowUrl) : null
                    }, buttonTpl);

                    if (this.options.infinite.triggerPrevType === this.TRIGGER_TYPES.button) {
                        this.$container.before(prevTriggerElement.element);
                    }

                    if (this.options.infinite.triggerPrevType === this.TRIGGER_TYPES.productTile) {
                        this.$container.before(prevTriggerElement.element);
                    }

                    this.interactionElements.push(prevTriggerElement);
                }
            }

            // Next
            if (this.options.items.size > this.options.items.curPage * this.options.items.pageSize) {
                const nextUrl = this._buildUrl(this.current_href, 'p', parseInt(this.options.items.curPage) + 1);

                // Indicator
                if (this.options.infinite.nextItemsIndicator && this.options.infinite.nextItemsIndicatorLabel !== '') {
                    const nextItemsIndicatorElement = new InteractionElement({
                        url: nextUrl,
                        caption: this.options.infinite.nextItemsIndicatorLabel,
                        type: 'indicator',
                        direction: this.DIRECTIONS.next,
                        loadingCaption: this.options.infinite.loadingTriggerLabel,
                        pageData: this.options.items,
                        shouldNotBeRemoved: true
                    }, indicatorTpl)
                    this.$container.after(nextItemsIndicatorElement.element);
                    this.interactionElements.push(nextItemsIndicatorElement);
                }

                // Observer area
                if (this.options.infinite.autoFetchNext) {
                    const nextObserverElement = new InteractionElement({
                        url: nextUrl,
                        type: 'observer',
                        direction: this.DIRECTIONS.next,
                        observer: this.observer,
                        pageData: this.options.items
                    }, observableAreaTpl)
                    this.interactionElements.push(nextObserverElement)
                    this.$container.after(nextObserverElement.element);
                }

                // Trigger
                if (this.options.infinite.triggerNextType !== this.TRIGGER_TYPES.none) {
                    const nextTriggerElement = new InteractionElement({
                        url: nextUrl,
                        caption: this.options.infinite.triggerNextLabel,
                        type: this.options.infinite.triggerNextType,
                        direction: this.DIRECTIONS.next,
                        loadingCaption: this.options.infinite.loadingTriggerLabel,
                        clickHandler: this._clickHandler.bind(this),
                        pageData: this.options.items,
                        arrow: this.options.infinite.triggerButtonArrowUrl ? require.toUrl(this.options.infinite.triggerButtonArrowUrl) : null,
                        img: this.options.infinite.triggerNextType === this.TRIGGER_TYPES.productTile ?
                            document.querySelector(this.options.infinite.itemSelector + ' .cs-product-tile__image img').src :
                            null
                    }, this.options.infinite.triggerNextType === this.TRIGGER_TYPES.button ? buttonTpl : productTileTpl)

                    if (this.options.infinite.triggerNextType === this.TRIGGER_TYPES.button) {
                        this.$container.after(nextTriggerElement.element);
                    }

                    if (this.options.infinite.triggerNextType === this.TRIGGER_TYPES.productTile) {
                        this.$container.append(nextTriggerElement.element);
                    }

                    this.interactionElements.push(nextTriggerElement);
                }
            }

            this._addListeners();
        },

        /**
         * Updates links & manages visibility of InteractionElements
         */
        _updateInteractionElements: function (direction) {
            if (direction === this.DIRECTIONS.prev) {
                if (this.options.items.lowestPage > 1) {
                    const prevUrl = this._buildUrl(this.current_href, 'p', parseInt(this.options.items.lowestPage) - 1);
                    this._setLoading(false, direction);
                    this._updateInteractionElement(prevUrl, direction);
                } else {
                    this._removeInteractionElements(direction);
                }
            } else {
                if (this.options.items.size > this.options.items.curPage * this.options.items.pageSize) {
                    const nextUrl = this._buildUrl(this.current_href, 'p', parseInt(this.options.items.highestPage) + 1);
                    this._setLoading(false, direction);
                    this._updateInteractionElement(nextUrl, direction);
                } else {
                    this._removeInteractionElements(direction);
                }
            }
        },

        /**
         * Performs ajax call for next page.
         * @param url
         * @private
         */
        _loadPage: function (url) {
            if (this.ajaxInProgress) {
                return
            }
            this.ajaxInProgress = true;

            const self = this;

            $.ajax({
                url: url + '&ajax=1',
                type: 'get',
                dataType: 'json',
                cache: true,
                success: function (response) {
                    self._afterPageLoad(response, url);
                },
                complete: function () {
                    self.ajaxInProgress = false;
                }
            });
        },

        /**
         * Appends fetched product tiles and updates page status.
         * @param response
         * @param newUrl
         * @private
         */
        _afterPageLoad: function (response, newUrl) {
            const self = this;
            history.pushState({}, document.title, newUrl);
            const responseDom = $($.parseHTML(response.productList));
            let directionToUpdate;

            // Next page
            if (response.curPage > self.options.items.curPage) {
                if (this.options.infinite.triggerNextType === this.TRIGGER_TYPES.productTile) {
                    $(`.${this.options.infinite.productTileTriggerClassName}`).before(responseDom.find(this.options.infinite.containerSelector).html())
                } else {
                    $(this.options.infinite.containerSelector).append(responseDom.find(this.options.infinite.containerSelector).html());
                }
                this.options.items.highestPage = response.curPage;

                directionToUpdate = this.DIRECTIONS.next;
                // Prev page
            } else {
                $(this.options.infinite.containerSelector).prepend(responseDom.find(this.options.infinite.containerSelector).html());
                this.options.items.lowestPage = response.curPage;
                directionToUpdate = this.DIRECTIONS.prev;
            }

            self.options.items.size = response.size;
            self.options.items.pageSize = response.pageSize;
            self.options.items.curPage = response.curPage;
            $(document).trigger('contentUpdated');
            self._updateInteractionElements(directionToUpdate);
        },

        /**
         * Builds new url with given params
         * @param url
         * @param replaceParam
         * @param replaceValue
         * @returns {*|string}
         * @private
         */
        _buildUrl: function (url, replaceParam, replaceValue) {
            if (replaceParam) {
                const href = new URL(url);
                href.searchParams.set(replaceParam, replaceValue);

                return href.toString();
            } else {
                return url;
            }
        },
    });
    return $.mgs.elasticsuiteInfiniteScroll;
});
