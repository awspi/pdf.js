import {
  AnnotationEditorType,
  assert,
  LINE_FACTOR,
  shadow
} from "../../shared/util.js";
import { AnnotationEditor } from "./editor.js";
import { getLeftTopCoord, KeyboardManager } from "./tools.js";

/**
 * Basic text editor in order to create a FreeTex annotation.
 */

class BoxCheckEditor extends AnnotationEditor {
  backgroundColors=["rgba(223,231,255,0.25)","rgba(255,229,206,0.25)"];

  #editorDivId = `${this.id}-editor`;

  static _freeTextDefaultContent = "";

  static _internalPadding = 0;

  static _defaultColor = null;

  static _defaultFontSize = 10;

  static get _keyboardManager() {
    return shadow(this, "_keyboardManager", new KeyboardManager([]));
  }

  static _type = "boxCheck";

  static _editorType = AnnotationEditorType.BOXCHECK;

  constructor(params) {
    super({ ...params, name: "boxCheckEditor" });
    this._isDraggable = true;
    // 自动渲染 不同于手动渲染
    if (params.fromCommand) {
      this.fromCommand = true;
      this.x = params.x;
      this.y = params.y;
      this.width = params.width;
      this.height = params.height;
      console.log('#fromCommand',params)

    } else {
      this.sourceX = params.x;
      this.sourceY = params.y;
    }
  }

  /** @inheritdoc */
  static initialize(l10n) {
    console.log('#initialize',l10n)
    AnnotationEditor.initialize(l10n);
    const style = getComputedStyle(document.documentElement);

    if (typeof PDFJSDev === "undefined" || PDFJSDev.test("TESTING")) {
      const lineHeight = parseFloat(
        style.getPropertyValue("--freetext-line-height")
      );
      assert(
        lineHeight === LINE_FACTOR,
        "Update the CSS variable to agree with the constant."
      );
    }

    this._internalPadding = parseFloat(
      style.getPropertyValue("--freetext-padding")
    );
  }

  /** @inheritdoc */
  static updateDefaultParams(type, value) {
    // do nothing
  }

  /** @inheritdoc */
  updateParams(type, value) {}

  /** @inheritdoc */
  static get defaultPropertiesToUpdate() {
    return [];
  }

  /** @inheritdoc */
  get propertiesToUpdate() {
    return [
    ];
  }

  /**
   * Helper to translate the editor with the keyboard when it's empty.
   * @param {number} x in page units.
   * @param {number} y in page units.
   */
  _translateEmpty(x, y) {
    this._uiManager.translateSelectedEditors(x, y, /* noCommit = */ true);
  }

  get isResizable() {
    return true;
  }

  /** @inheritdoc */
  rebuild() {
    if (!this.parent) {
      return;
    }
    super.rebuild();
    if (this.div === null) {
      return;
    }

    if (!this.isAttachedToDOM) {
      // At some point this editor was removed and we're rebuilting it,
      // hence we must add it to its parent.
      this.parent.add(this);
    }
  }

  /** @inheritdoc */
  enableEditMode() {
    if (this.isInEditMode()) {
      return;
    }

    this.parent.setEditingState(false);
    this.parent.updateToolbar(AnnotationEditorType.FREETEXT);
    super.enableEditMode();
    this.overlayDiv.classList.remove("enabled");
    this._isDraggable = false;
    this.div.removeAttribute("aria-activedescendant");
  }

  /** @inheritdoc */
  disableEditMode() {
    if (!this.isInEditMode()) {
      return;
    }

    this.parent.setEditingState(true);
    super.disableEditMode();
    this.overlayDiv.classList.add("enabled");
    this.editorDiv.contentEditable = false;
    this.div.setAttribute("aria-activedescendant", this.#editorDivId);
    this._isDraggable = true;

    // On Chrome, the focus is given to <body> when contentEditable is set to
    // false, hence we focus the div.
    this.div.focus({
      preventScroll: true /* See issue #15744 */,
    });

    // In case the blur callback hasn't been called.
    this.isEditing = false;
    this.parent.div.classList.add("boxcheckEditing");
  }

  /** @inheritdoc */
  onceAdded() {}

  /** @inheritdoc */
  remove(forHide = false) {
    this.isEditing = false;
    if (this.parent) {
      this.parent.setEditingState(true);
      this.parent.div.classList.add("boxcheckEditing");
    }
    super.remove(forHide);
  }

  /**
   * Commit the content we have in this editor.
   * @returns {undefined}
   */
  commit() {
    if (!this.isInEditMode()) {
      return;
    }

    super.commit();
  }

  /** @inheritdoc */
  shouldGetKeyboardEvents() {
    return this.isInEditMode();
  }

  /** @inheritdoc */
  enterInEditMode() {
    this.enableEditMode();
    this.editorDiv.focus();
  }

  /**
   * onkeydown callback.
   * @param {KeyboardEvent} event
   */
  keydown(event) {}

  /** @inheritdoc */
  disableEditing() {}

  /** @inheritdoc */
  enableEditing() {}

  /** @inheritdoc */
  render() {
    console.log('#render box,this.div:%o',this.div)
    if (this.div) {
      return this.div;
    }
    super.render();
    this.originWith = 0;
    this.originHeight = 0;
    this.div.style.width = "0px";
    this.div.style.height = "0px";
    this.div.style.position = "absolute";
    // this.div.style.userSelect = "none";
    // this.div.style.pointerEvents = "none";
    this.div.style.backgroundColor = "rgba(255,255,0,0.25)";
    return this.div;
  }

  select() {
    this.div.classList.add("noBorderBoxCheckEditor")
    super.select();
  }

  unselect(){
    this.div.classList.remove("noBorderBoxCheckEditor")
    super.unselect();
  }

  pointerLocationChange(event) {
    const sourceX = this.parentOffset.x;
    const sourceY = this.parentOffset.y;

    const coord = getLeftTopCoord(event.target);
    const offsetX = coord.x + event.offsetX;
    const offsetY = coord.y + event.offsetY;

    let width = offsetX - sourceX - this.sourceX;
    let height = offsetY - sourceY - this.sourceY;
    if (width < 0 || height < 0) {
      width = 0;
      height = 0;
    }
    this.originWith = width;
    this.originHeight = height;
    this.div.style.width = width + "px";
    this.div.style.height = height + "px";
  }

  postAttach(){
    console.log('#postAttach')
    this.adaptSize();
  }

  adaptive() {
    if (this.autoRender) {
      this.adaptSize();
    }
  }

  postConfirm() {
    const parentWidth = this.div.parentNode.scrollWidth;
    const parentHeight = this.div.parentNode.scrollHeight;
    this.width = (1.0 * this.originWith) / parentWidth;
    this.height = (1.0 * this.originHeight) / parentHeight;
    this.adaptSize();
    this.parent.setSelected(this);
  }

  adaptSize() {

    const pWidth = this.div.parentNode.style.width;
    const pHeight = this.div.parentNode.style.height;
    const sWidth = pWidth.replace("calc(", "calc(" + this.width + "*");
    const sHeight = pHeight.replace("calc(", "calc(" + this.height + "*");
    this.div.style.height = sHeight;
    this.div.style.width = sWidth;
    //背景色
    const id = this.id.split('pdfjs_internal_editor_')[1]
    this.div.style.backgroundColor=this.backgroundColors[id % this.backgroundColors.length]
    console.log('#adapt',this.backgroundColors,id)
  }

  /** @inheritdoc */
  static deserialize() {
    return null;
  }

  /** @inheritdoc */
  serialize() {
    return null;
  }
}

export { BoxCheckEditor };
