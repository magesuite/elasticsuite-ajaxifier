define(['jquery', 'mage/template'], function ($, mageTemplate) {
    /**
     * Wrapper object for interaction elements (buttons, product tiles, observer areas etc).
     * Created to separate logic of infinite scroll.
     */
    return class InteractionElement {
        /**
         * prev | next
         * @type {'prev' | 'next' | null}
         */
        direction = null;
        /**
         * button | product_tile | indicator | observer
         * @type {string | null}
         */
        type = null;
        /**
         * Main HTML element
         * @type {HTMLElement | null}
         */
        element = null;
        /**
         * Label HTML element
         * @type {HTMLElement | null}
         */
        #label = null;
        #loadingClass = 'cs-infinite-scroll--loading';
        /**
         * E.g. 'Next', "Previous', set in admin
         * @type {string | null}
         */
        #caption = null;
        /**
         * Set in admin, usually 'Loading'
         * @type {null}
         */
        #loadingCaption = null;
        /**
         * If true InteractionElement will not be removed from interactionElements array.
         * See infinite-scroll.js:_removeInteractionElements for reference.
         * @type {boolean}
         */
        #shouldNotBeRemoved = false;
        /**
         * IntersectionObserver. See infinite-scroll.js:_initIntersectionObserver for reference.
         * @type {IntersectionObserver | null}
         */
        #observer = null;
        /**
         * On click handler. See infinite-scroll.js:_clickHandler for reference.
         * @type {null}
         */
        #clickHandler = null;
        /**
         * Reference for infinite-scroll.js:option.items
         * @type {{curPage: number, size: number, highestPage: number, pageSize: number, lowestPage: number}}
         */
        #pageData = {
            size: 0,
            pageSize: 0,
            curPage: 0,
            lowestPage: 1,
            highestPage: 1,
        }

        /**
         * @param data
         * @param template
         */
        constructor(data, template) {
            this.direction = data.direction;
            this.type = data.type;
            this.element = new DOMParser().parseFromString(mageTemplate(template, {data}), 'text/html').body.firstChild;
            this.#label = this.element.querySelector('[data-role="label"]');
            this.#caption = data.caption;
            this.#loadingCaption = data.loadingCaption;
            this.#shouldNotBeRemoved = data.shouldNotBeRemoved;
            this.#observer = data.observer;
            this.#clickHandler = data.clickHandler;
            this.#pageData = data.pageData;

            if (this.#label) {
                this.#label.innerText = this._getCaption(this.#caption);
            }
        }
        /**
         * Sets element visibility
         * @param isVisible
         */
        toggleVisibility (isVisible) {
            this.element.style.display = isVisible ? null : 'none';
        }
        /**
         * Sets loading class and label
         * @param isLoading {boolean}
         */
        setLoading (isLoading) {
            if (isLoading) {
                this.element.classList.add(this.#loadingClass);
                if (this.#label) {
                    this.#label.innerText = this.#loadingCaption;
                }
            } else {
                this.element.classList.remove(this.#loadingClass);
                if (this.#label) {
                    this.#label.innerText = this._getCaption(this.#caption);
                }
            }
        }
        /**
         * Removes element HTML node.
         * If #shouldNotBeRemoved = true, only runs update method (Indicator element shouldn't be removed).
         * @returns {boolean}
         */
        remove () {
            if (this.#shouldNotBeRemoved) {
                this.update();
            } else {
                this.element.remove();
            }

            return this.#shouldNotBeRemoved;
        }

        /**
         *
         * @param url {string | undefined}
         * @param direction {direction | undefined}
         */
        update (url, direction) {
            if (url && direction === this.direction) {
                this.element.setAttribute('data-url', url);
            }
            if (this.#label) {
                this.#label.innerText = this._getCaption(this.#caption);
            }
        }
        /**
         * Adds on click event listener or observes observer.
         */
        addListeners () {
            if (this.#observer) {
                this.#observer.observe(this.element);
                return;
            }
            if (this.#clickHandler) {
                $(this.element).on('click', this.#clickHandler);
            }
        }
        /**
         * Removes on click event listener or observer.
         */
        removeListeners () {
            if (this.#observer) {
                try {
                    this.#observer.unobserve(this.element);
                } catch (e) {}
            }
            if (this.#clickHandler) {
                $(this.element).off('click', this.#clickHandler)
            }
        }
        /**
         * Returns formatted caption, based on #pageData.
         * %c - current qty of fetched products,
         * %t - total qty of fetched products,
         * %p - previous products qty to load,
         * %n - next products qty to load
         * @param caption {string}
         * @returns {*|string}
         * @private
         */
        _getCaption (caption) {
            if (typeof caption !== 'string') {
                return caption;
            }

            let result = caption;

            if (result.includes('%c')) {
                let nextProducts = this.#pageData.size - this.#pageData.highestPage * this.#pageData.pageSize;
                nextProducts = nextProducts >= 0 ? nextProducts : 0;
                result = result.replace('%c', this.#pageData.size - ((this.#pageData.lowestPage - 1) * this.#pageData.pageSize) - nextProducts);
            }

            if (result.includes('%t')) {
                result = result.replace('%t', this.#pageData.size);
            }

            if (result.includes('%p')) {
                result = result.replace('%p', ((this.#pageData.lowestPage - 1) * this.#pageData.pageSize));
            }

            if (result.includes('%n')) {
                result = result.replace('%n', (this.#pageData.size - this.#pageData.curPage * this.#pageData.pageSize));
            }

            return result;
        }
    };
});
