Modal.elements = [];

// TẠO THƯ VIỆN MODAL ========================================================
// ===========================================================================
function Modal(options = {}) {
    // Nhận giá trị truyền vào từ modal ======================================
    this.opt = Object.assign(
        {
            // templateId,
            cssClass: [],
            destroyOnClose: true,
            closeMethods: ["button", "overlay", "escape"],
            footer: false,
            // onOpen,
            // onClose,
        },
        options
    );

    this.template = document.querySelector(`#${this.opt.templateId}`);

    if (!this.template) {
        console.error(`${this.opt.templateId} does not exist`);
    }

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
    const content = this.template.content.cloneNode(true);

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
    const modalContent = document.createElement("div");
    modalContent.className = "modal__content";
    // =================
    modalContent.append(content);
    container.append(modalContent);

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
    document.body.classList.add("no-scroll");

    document.body.style.paddingRight = this._getScrollbarWidth() + "px";

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

        if (!Modal.elements.length) {
            document.body.classList.remove("no-scroll");
            document.body.style.paddingRight = "";
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
