Modal.elements = [];

// TẠO THƯ VIỆN MODAL ========================================================
// ===========================================================================
function Modal(options = {}) {
    if (!options.content && !options.templateId) {
        console.error("You must provide one of 'content' or 'templateId'.");
        return;
    }

    if (options.content && options.templateId) {
        options.templateId = null;
        console.warn(
            "Both 'content' and 'templateId' are specified. 'content' will take precedence, and 'templateId' will be ignored"
        );
    }

    if (options.templateId) {
        this.template = document.querySelector(`#${options.templateId}`);

        if (!this.template) {
            console.error(`${options.templateId} does not exist`);
            return;
        }
    }

    // Nhận giá trị truyền vào từ modal ======================================
    this.opt = Object.assign(
        {
            // templateId,
            enableScrollLock: true,
            cssClass: [],
            destroyOnClose: true,
            closeMethods: ["button", "overlay", "escape"],
            footer: false,
            scrollLockTarget: () => document.body,
            // onOpen,
            // onClose,
        },
        options
    );

    this.content = this.opt.content;
    const { closeMethods } = this.opt;
    this._allowButtonClose = closeMethods.includes("button");
    this._allowBackdropClose = closeMethods.includes("overlay");
    this._allowEscapeClose = closeMethods.includes("escape");

    this._footerBtns = []; // Tạo mảng lưu trữ các button tạo ra

    this._handleEscapeKey = this._handleEscapeKey.bind(this);
}

// HÀM LẤY ĐỘ RỘNG CỦA THANH CUỘN =======================================
// ======================================================================
Modal.prototype._getScrollbarWidth = () => {
    // LẤY GIÁ TRỊ CHIỀU RỘNG CỦA SCROLLBAR SAU LẦN ĐỌC ĐẦU TIÊN
    if (this._scrollbarWidth) return this._scrollbarWidth;
    // TẠO PHẦN TỬ ĐỂ LẤY ĐỘ RỘNG THANH CUỘN
    const div = document.createElement("div");
    Object.assign(div.style, {
        overflow: "scroll",
        position: "absolute",
        top: "-9999px",
    });

    document.body.appendChild(div);

    // TÍNH TOÁN ĐỘ RỘNG SCROLLBAR
    this._scrollbarWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);

    return this._scrollbarWidth;
};

// HÀM TẠO MODAL MỚI =======================================================
// =========================================================================
Modal.prototype._build = function () {
    const contentNode = this.content ? document.createElement("div") : this.template.content.cloneNode(true);

    if (this.content) {
        contentNode.innerHTML = this.content;
    }
    // Create modal element
    this._backdrop = document.createElement("div");
    this._backdrop.className = "modal__backdrop";
    // ==============================
    const container = document.createElement("div");
    container.className = "modal__container";

    // THÊM CLASS VÀO CONTAINER CỦA TỪNG MODAL
    this.opt.cssClass.forEach((className) => {
        if (typeof className === "string") {
            container.classList.add(className);
        }
    });
    // TẠO NÚT ĐÓNG MODAL
    if (this._allowButtonClose) {
        // const closeBtn = document.createElement("button");
        // closeBtn.className = "modal__close";
        // closeBtn.innerHTML = "&times;";
        // closeBtn.onclick = () => this.close();
        const closeBtn = this._createButton("&times;", "modal__close", () => this.close());
        container.append(closeBtn);
    }
    // =================
    this._modalContent = document.createElement("div");
    this._modalContent.className = "modal__content";
    // =================
    this._modalContent.append(contentNode);
    container.append(this._modalContent);

    // ==================
    if (this.opt.footer) {
        this._modalFooter = document.createElement("div");
        this._modalFooter.className = "footer__btn";

        // ======================
        // if (this._footerContent) {
        //     this._modalFooter.innerHTML = this._footerContent;
        // }

        this._renderFooterContents();
        // ========================
        this._renderFooterButton();

        container.append(this._modalFooter);
    }
    // ===============
    this._backdrop.append(container);
    document.body.append(this._backdrop);
};
// HÀM XỬ LÝ THAY THẾ CONTENT ===============================================
Modal.prototype.setContent = function (content) {
    this.content = content;
    if (this._modalContent) {
        this._modalContent.innerHTML = this.content;
    }
};

// HÀM XỬ LÝ THÊM FOOTER CONTENT ============================================
// ==========================================================================
Modal.prototype.setFooterContent = function (html) {
    this._footerContent = html;
    this._renderFooterContents();
};

// HÀM XỬ LÝ THÊM NÚT BUTTON ================================================
// ==========================================================================
Modal.prototype.addFooterButton = function (title, cssClass, callback) {
    const footerBtn = this._createButton(title, cssClass, callback);
    this._footerBtns.push(footerBtn);
    this._renderFooterButton();
};

Modal.prototype._renderFooterContents = function () {
    if (this._modalFooter && this._footerContent) {
        this._modalFooter.innerHTML = this._footerContent;
    }
};
Modal.prototype._renderFooterButton = function () {
    if (this._modalFooter) {
        this._footerBtns.forEach((button) => {
            this._modalFooter.append(button);
        });
    }
};

// HÀM TÍNH TOÁN CUỘN ======================================================
Modal.prototype._hasScrollbar = (target) => {
    if ([document.documentElement, document.body].includes(target)) {
        return (
            document.documentElement.scrollHeight > document.documentElement.clientHeight ||
            document.body.scrollHeight > document.body.clientHeight
        );
    }
    return target.scrollHeight > target.clientHeight;
};

Modal.prototype._createButton = function (title, cssClass, callback) {
    const button = document.createElement("button");
    button.className = cssClass;
    button.innerHTML = title;
    button.onclick = callback;

    return button;
};

// HÀM XỬ LÝ OPEN MODAL =====================================================
// ==========================================================================
Modal.prototype.open = function () {
    // Push modal vao element
    Modal.elements.push(this);
    // xét điều kiện, nếu mà tồn tại backdrop thì k tạo mới
    if (!this._backdrop) {
        this._build();
    }

    // set thời gian xuất hiện modal
    setTimeout(() => {
        this._backdrop.classList.add("show");
    }, 0);

    //Attack event listener
    if (this._allowBackdropClose) {
        this._backdrop.onclick = (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        };
    }

    if (this._allowEscapeClose) {
        document.addEventListener("keydown", this._handleEscapeKey);
    }

    // Chạy log khi modal mở
    this._onTransitionEnd(this.opt.onOpen);

    // stop scroll
    if (Modal.elements.length === 1 && this.opt.enableScrollLock) {
        const target = this.opt.scrollLockTarget();

        if (this._hasScrollbar(target)) {
            target.classList.add("no-scroll");
            const targetPadRight = parseInt(getComputedStyle(target).paddingRight);
            target.style.paddingRight = targetPadRight + this._getScrollbarWidth() + "px";
        }
    }

    return this._backdrop;
};

// HÀM XỬ LÝ KHI CHẠY XONG TRANSITION ======================================
// =========================================================================
Modal.prototype._onTransitionEnd = function (callback) {
    this._backdrop.ontransitionend = (e) => {
        if (e.propertyName !== "transform") return;
        if (typeof callback === "function") callback();
    };
};

// HÀM ĐÓNG MODAL ==========================================================
// =========================================================================
Modal.prototype.close = function (destroy = this.opt.destroyOnClose) {
    Modal.elements.pop();
    this._backdrop.classList.remove("show");

    if (this._allowEscapeClose) {
        document.removeEventListener("keydown", this._handleEscapeKey);
    }

    this._onTransitionEnd(() => {
        if (destroy) {
            this._backdrop.remove();
            this._backdrop = null;
            this._modalFooter = null;
        }

        if (this.opt.enableScrollLock && !Modal.elements.length) {
            const target = this.opt.scrollLockTarget();

            if (this._hasScrollbar(target)) {
                target.classList.remove("no-scroll");
                target.style.paddingRight = "";
            }
        }
        // Chạy log khi modal đóng
        if (typeof this.opt.onClose === "function") this.opt.onClose();
    });
};

// HÀM XỬ LÝ EVENT LISTENER "ESCAPE" =======================================
Modal.prototype._handleEscapeKey = function (e) {
    this._lastElement = Modal.elements[Modal.elements.length - 1];
    if (e.key === "Escape" && this === this._lastElement) {
        this.close();
    }
};

// =========================================================================
// =========================================================================
Modal.prototype.destroy = function () {
    this.close(true);
};
