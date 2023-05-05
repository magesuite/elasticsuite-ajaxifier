define([
    'jquery',
    'matchMedia',
    'mage/translate',
], function ($, mediaCheck, $t) {
    'use strict';

    /**
     * How does it work:
     * -> Options are parsed to correct types
     * -> Depending on media breakpoint, _create runs _toggleInfiniteScroll which:
     *    -> Initializes Intersection Observer
     *    -> Initializes ui elements (observer areas, buttons, fake product tiles).
     *       Ui elements are wrappers for HTML elements with their own methods.
     * -> When user clicks on trigger (button, product tile), _clickHandler fires _loadPage.
     * -> When users scrolls to the end of listing, this.observer fires _loadPage.
     * -> _loadPage fetches new products, passes them to _afterPageLoad.
     * -> _afterPageLoad puts response to listing and triggers _updateUiElements.
     * -> _updateUiElements sets new urls and/or removes unnecessary ui elements.
     */
    $.widget('mgs.infniteScroll', {
        options: {
            infinite: {
                mediaBreakpoint: false,
                triggerPrevType: 'none',
                triggerPrevLabel: $t('Previous items'),
                triggerNextType: 'none',
                triggerNextLabel: $t('Next items'),
                nextItemsIndicator: false,
                nextItemsIndicatorLabel: $t('Showing %c from %t products'),
                autoFetchNext: true,
                autoFetchLimit: 0,
                observerThreshold: 100,
                loadingTriggerLabel: $t('Loading'),
                itemSelector: '.cs-grid-layout__brick:not(.cs-grid-layout__brick--teaser)',
                containerSelector: '.products.list.items',
                toolbarPaginationSelector: '.cs-toolbar__item--pagination',
                areaClassName: 'cs-infinite-scroll__area',
                buttonTriggerClassName: 'cs-infinite-scroll__button',
                productTileTriggerClassName: 'cs-infinite-scroll__brick',
                triggerLabelClassName: 'cs-infinite-scroll__label',
                indicatorClassName: 'cs-infinite-scroll__indicator',
                loadingClassName: 'cs-infinite-scroll--loading',
                loadingSuffix: '--loading'
            },
            items: {
                size: 0,
                pageSize: 0,
                curPage: 0
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
        uiElements: [],
        $container: null,
        toolbarElement: null,
        lowestPage: 1,
        highestPage: 1,

        _create: function () {
            if (this.options.items.size === 0) {
                return;
            }

            this._parseOptions();
            this.lowestPage = this.highestPage = this.options.items.curPage;
            this.$container = $(this.options.infinite.containerSelector);
            this.current_href = window.location.href;
            this.$toolbarElement = $(this.options.infinite.toolbarPaginationSelector);

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

                if (this.uiElements.length) {
                    this._toggleVisibility(true);
                    this._addListeners();
                } else {
                    this._initUiElements();
                }

                this.$toolbarElement.hide();
            } else {
                if (this.uiElements.length) {
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
         * Sets loading indicators in ui elements
         * @param isLoading {boolean}
         * @param direction {string}
         * @private
         */
        _setLoading: function (isLoading, direction) {
            if (this.uiElements.length) {
                this.uiElements.forEach(element => {
                    if (element.direction === direction) {
                        element.setLoading(isLoading);
                    }
                })
            }
        },

        /**
         * Sets ui elements visibility.
         * If direction is ommited all elments will be affected.
         * @param isVisible {boolean}
         * @param direction {string}
         * @private
         */
        _toggleVisibility: function (isVisible, direction) {
            if (this.uiElements.length) {
                this.uiElements.forEach(element => {
                    if (typeof direction === 'undefined' || element.direction === direction) {
                        element.toggleVisibility(isVisible);
                    }
                })
            }
        },

        /**
         * Updates ui elements (in most cases updates urls).
         * @param url
         * @param direction
         * @private
         */
        _updateUiElement: function (url, direction) {
            if (this.uiElements.length) {
                this.uiElements.forEach(element => {
                    if (element.direction === direction) {
                        element.update(url);
                    }
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
            if (this.uiElements.length) {
                this.uiElements.forEach(element => {
                    if (typeof direction === 'undefined') {
                        element.addListeners();
                    } else if (element.direction === direction) {
                        element.addListeners();
                    }
                })
            }
        },

        /**
         * Detaches ui elements listeners.
         * If direction is ommited all elments will be affected.
         * @param direction
         * @private
         */
        _removeListeners: function (direction) {
            if (this.uiElements.length) {
                this.uiElements.forEach(element => {
                    if (typeof direction === 'undefined') {
                        element.removeListeners();
                    } else if (element.direction === direction) {
                        element.removeListeners();
                    }
                })
            }
        },

        /**
         * Removes HTML element & ui element itself. Direction is required.
         * @param direction
         * @private
         */
        _removeElement: function (direction) {
            if (this.uiElements.length && direction) {
                this.uiElements = this.uiElements.filter((uiElement) => {
                    if (uiElement.direction === direction) {
                        return uiElement.remove();
                    } else {
                        return true
                    }
                })
            }
        },

        /**
         * Initializes Intersection Obeserver
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
         * Elements are saved in this.uiElements array.
         * @private
         */
        _initUiElements: function () {
            // Prev
            if (this.lowestPage > 1) {
                const prevUrl = this._buildUrl(this.current_href, 'p', parseInt(this.options.items.curPage) - 1);

                // Trigger
                if (this.options.infinite.triggerPrevType !== this.TRIGGER_TYPES.none) {
                    const prevTriggerElement = this._createTrigger({
                        url: prevUrl,
                        caption: this.options.infinite.triggerPrevLabel,
                        direction: this.DIRECTIONS.prev,
                        type: this.options.infinite.triggerPrevType
                    });

                    if (this.options.infinite.triggerPrevType === this.TRIGGER_TYPES.button) {
                        this.$container.before(prevTriggerElement.element);
                    }

                    if (this.options.infinite.triggerPrevType === this.TRIGGER_TYPES.productTile) {
                        this.$container.before(prevTriggerElement.element);
                    }

                    this.uiElements.push(prevTriggerElement);
                }
            }

            // Next
            if (this.options.items.size > this.options.items.curPage * this.options.items.pageSize) {
                const nextUrl = this._buildUrl(this.current_href, 'p', parseInt(this.options.items.curPage) + 1);

                // Indicator
                if (this.options.infinite.nextItemsIndicator && this.options.infinite.nextItemsIndicatorLabel !== '') {
                    const nextItemsIndicatorElement = this._createIndicatorElement({
                        caption: this.options.infinite.nextItemsIndicatorLabel,
                        direction: this.DIRECTIONS.next
                    });
                    this.$container.after(nextItemsIndicatorElement.element);
                    this.uiElements.push(nextItemsIndicatorElement);
                }

                // Observer area
                if (this.options.infinite.autoFetchNext) {
                    const nextObserverElement = this._createObserverArea({
                        url: nextUrl,
                        direction: this.DIRECTIONS.next
                    });
                    this.uiElements.push(nextObserverElement)
                    this.$container.after(nextObserverElement.element);
                }

                // Trigger
                if (this.options.infinite.triggerNextType !== this.TRIGGER_TYPES.none) {
                    const nextTriggerElement = this._createTrigger({
                        url: nextUrl,
                        caption: this.options.infinite.triggerNextLabel,
                        direction: this.DIRECTIONS.next,
                        type: this.options.infinite.triggerNextType
                    });

                    if (this.options.infinite.triggerNextType === this.TRIGGER_TYPES.button) {
                        this.$container.after(nextTriggerElement.element);
                    }

                    if (this.options.infinite.triggerNextType === this.TRIGGER_TYPES.productTile) {
                        this.$container.append(nextTriggerElement.element);
                    }

                    this.uiElements.push(nextTriggerElement);
                }
            }

            this._addListeners();
        },

        /**
         * @param url
         * @param caption
         * @param direction
         * @returns {ObserverArea}
         * @private
         */
        _createObserverArea: function ({url, direction}) {
            const self = this;

            function ObserverArea() {
                this.element = document.createElement('div');
                this._label = document.createElement('span');
                this._loadingClass = self.options.infinite.areaClassName + self.options.infinite.loadingSuffix;
                this.direction = direction;
                this._caption = '';
                this._loadingLabel = '';

                this.element.classList.add(self.options.infinite.areaClassName, `${self.options.infinite.areaClassName}--${direction}`);
                this.element.setAttribute(self.DATA_ATTRIBUTES.dataUrl, url);
                this.element.setAttribute(self.DATA_ATTRIBUTES.dataDirection, direction);
                this._label.innerText - this._caption;
                this.element.appendChild(this._label);
            }

            Object.assign(ObserverArea.prototype, self._getCommonUiProto(), self._getAreaProto());
            return new ObserverArea();
        },

        /**
         * Creates trigger element (button or product tile).
         * @param url
         * @param caption
         * @param direction
         * @param type
         * @returns {Button|ProductTile}
         * @private
         */
        _createTrigger: function ({url, caption, direction, type}) {
            if (type === this.TRIGGER_TYPES.button) {
                return this._createButtonTrigger({url, caption, direction});
            }

            if (type === this.TRIGGER_TYPES.productTile) {
                return this._createProductTileTrigger({url, caption, direction})
            }
        },

        /**
         * Creates indicator element (it's just caption, has no actions).
         * @param caption
         * @param direction
         * @returns {IndicatorElement}
         * @private
         */
        _createIndicatorElement: function ({caption, direction}) {
            const self = this;

            function IndicatorElement() {
                this.element = document.createElement('div');
                this._label = document.createElement('span');
                this._loadingClass = self.options.infinite.indicatorClassName + self.options.infinite.loadingSuffix;
                this.direction = direction;
                this._caption = caption;

                this.element.classList.add(self.options.infinite.indicatorClassName, `${self.options.infinite.indicatorClassName}--${direction}`);
                this._label.innerText = self._getCaption(this._caption);
                this.element.appendChild(this._label);

                this.addListeners = function () {};
                this.removeListeners = function () {};
                this.setUrl = function () {};
                this.remove = function () {
                    this.update();
                    return true;
                }
                this.update = function () { this._label.innerText = self._getCaption(this._caption); }
            }

            Object.assign(IndicatorElement.prototype, self._getCommonUiProto());
            return new IndicatorElement();
        },

        /**
         * Returns common ui elements prototype methods.
         * @returns {{toggleVisibility: toggleVisibility, setUrl: setUrl}}
         * @private
         */
        _getCommonUiProto: function () {
            const self = this;

            return {
                _loadingLabel: self.options.infinite.loadingTriggerLabel,
                toggleVisibility: function (isVisible) {
                    this.element.style.display = isVisible ? null : 'none';
                },
                setLoading: function (isLoading) {
                    if (isLoading) {
                        this._label.innerText = this._loadingLabel;
                        this.element.classList.add(this._loadingClass);
                    } else {
                        this._label.innerText = self._getCaption(this._caption);
                        this.element.classList.remove(this._loadingClass);
                    }
                },
                remove: function () {
                    this.element.remove();
                    return false;
                },
                update: function (url) {
                    this.element.setAttribute(self.DATA_ATTRIBUTES.dataUrl, url);
                    this._label.innerText = self._getCaption(this._caption);
                }
            }
        },

        /**
         * Returns trigger-type (button, product tile) ui elements prototype methods.
         * @returns {{removeListeners: removeListeners, _loadingLabel, setLoading: setLoading, addListeners: addListeners}}
         * @private
         */
        _getTriggerProto: function () {
            const self = this;

            return {
                addListeners: function () {
                    $(this.element).on('click', self._clickHandler.bind(self))
                },
                removeListeners: function () {
                    $(this.element).off('click', self._clickHandler.bind(self))
                }
            }
        },

        /**
         * Returns intersection observer element prototype methods.
         * @returns {{removeListeners: removeListeners, setLoading: setLoading, addListeners: addListeners}}
         * @private
         */
        _getAreaProto: function () {
            const self = this;

            return {
                addListeners: function () {
                    self.observer.observe(this.element);
                },
                removeListeners: function () {
                    try {
                        self.observer.unobserve(this.element);
                    } catch (e) {}
                }
            }
        },

        /**
         * Helper method for _createTrigger.
         * @param url
         * @param caption
         * @param direction
         * @returns {Button}
         * @private
         */
        _createButtonTrigger: function ({url, caption, direction}) {
            const self = this;

            function Button() {
                this.element = document.createElement('button');
                this._label = document.createElement('span');
                this._caption = caption;
                this._loadingClass = self.options.infinite.buttonTriggerClassName + self.options.infinite.loadingSuffix;
                this.direction = direction;

                this.element.classList.add(self.options.infinite.buttonTriggerClassName, `${self.options.infinite.buttonTriggerClassName}--${direction}`);
                this.element.setAttribute(self.DATA_ATTRIBUTES.dataUrl, url);
                this.element.setAttribute(self.DATA_ATTRIBUTES.dataDirection, direction);
                this._label.classList.add(self.options.infinite.triggerLabelClassName);
                this._label.innerText = self._getCaption(this._caption);
                this.element.appendChild(this._label);
            }

            Object.assign(Button.prototype, self._getCommonUiProto(), self._getTriggerProto());
            return new Button();
        },

        /**
         * Helper method for _createTrigger.
         * @param url
         * @param caption
         * @param direction
         * @returns {ProductTile|Button}
         * @private
         */
        _createProductTileTrigger: function ({url, caption, direction}) {
            const self = this;

            function ProductTile() {
                // Clone real product tile
                const existingProductTile = document.querySelector(self.options.infinite.itemSelector);

                if (!existingProductTile) {
                    return this._createButtonTrigger({url, caption, direction})
                }

                this.element = existingProductTile.cloneNode(true);
                this._caption = caption
                this._loadingClass = self.options.infinite.productTileTriggerClassName + self.options.infinite.loadingSuffix;
                this.direction = direction;

                // Remove links
                const elementsWithLink = this.element.querySelectorAll('[href]');

                if (elementsWithLink.length) {
                    elementsWithLink.forEach((elementWithLink) => elementWithLink.removeAttribute('href'))
                }

                // Remove hover effects
                const elementsWithHover = this.element.querySelectorAll('[class*="hover"]');
                if (elementsWithHover.length) {
                    elementsWithHover.forEach((elementWithHover) => elementWithHover.remove());
                }

                // Set attributes
                this.element.classList.add(self.options.infinite.productTileTriggerClassName);
                this.element.setAttribute(self.DATA_ATTRIBUTES.dataUrl, url);
                this.element.setAttribute(self.DATA_ATTRIBUTES.dataDirection, direction);

                // Create overlay with caption
                const productTileOverlay = document.createElement('div');
                this._label = document.createElement('span');

                productTileOverlay.classList.add('cs-infinite-scroll__product-tile-overlay');
                this._label.classList.add(self.options.infinite.triggerLabelClassName);
                this._label.innerText = self._getCaption(this._caption);
                productTileOverlay.appendChild(this._label);
                this.element.firstChild.nextElementSibling.appendChild(productTileOverlay);
            }

            Object.assign(ProductTile.prototype, self._getCommonUiProto(), self._getTriggerProto());
            return new ProductTile();
        },

        /**
         * Returns formatted caption. Ui elments can have labels with variables:
         * %c - current qty of fetched items,
         * %t - total qty,
         * %p - previous items qty,
         * %n - next items qty.
         * @param caption
         * @returns {*|string}
         * @private
         */
        _getCaption: function (caption) {
            if (typeof caption !== 'string') {
                return caption;
            }

            let result = caption;

            if (result.includes('%c')) {
                let nextProducts = this.options.items.size - this.options.items.curPage * this.options.items.pageSize;
                nextProducts = nextProducts >= 0 ? nextProducts : 0;
                result = result.replace('%c', this.options.items.size - ((this.lowestPage - 1) * this.options.items.pageSize) - nextProducts);
            }

            if (result.includes('%t')) {
                result = result.replace('%t', this.options.items.size);
            }

            if (result.includes('%p')) {
                result = result.replace('%p', ((this.lowestPage - 1) * this.options.items.pageSize));
            }

            if (result.includes('%n')) {
                result = result.replace('%n', (this.options.items.size - this.options.items.curPage * this.options.items.pageSize));
            }

            return result;
        },

        /**
         * Updates links & manages visibility of UI elements
         */
        _updateUiElements: function (direction) {
            if (direction === this.DIRECTIONS.prev) {
                if (this.lowestPage > 1) {
                    const prevUrl = this._buildUrl(this.current_href, 'p', parseInt(this.lowestPage) - 1);
                    this._setLoading(false, direction);
                    this._updateUiElement(prevUrl, direction);
                } else {
                    this._removeElement(direction);
                }
            } else {
                if (this.options.items.size > this.options.items.curPage * this.options.items.pageSize) {
                    const nextUrl = this._buildUrl(this.current_href, 'p', parseInt(this.highestPage) + 1);
                    this._setLoading(false, direction);
                    this._updateUiElement(nextUrl, direction);
                } else {
                    this._removeElement(direction);
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
         * Appends fetched elements and updates page status.
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
                this.highestPage = response.curPage;

                directionToUpdate = this.DIRECTIONS.next;
                // Prev page
            } else {
                $(this.options.infinite.containerSelector).prepend(responseDom.find(this.options.infinite.containerSelector).html());
                this.lowestPage = response.curPage;
                directionToUpdate = this.DIRECTIONS.prev;
            }

            self.options.items.size = response.size;
            self.options.items.pageSize = response.pageSize;
            self.options.items.curPage = response.curPage;
            $(document).trigger('contentUpdated');
            self._updateUiElements(directionToUpdate)
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
    return $.mgs.infniteScroll;
});
