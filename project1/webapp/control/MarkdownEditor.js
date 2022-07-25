sap.ui.define(
  [
    "sap/ui/core/Control",
    "sap/m/InputBase",
    // "sapit/thirdparty/easymde.min"
    "project1/control/easymde.min",
  ],
  function (Control, InputBase) {
    "use strict";

    var MarkdownEditor = InputBase.extend("project1.control.MarkdownEditor", {
      metadata: {
        // library: "sapit",

        properties: {
          height: {
            type: "sap.ui.core.CSSSize",
            defaultValue: "25rem",
          },
          minHeight: {
            type: "sap.ui.core.CSSSize",
            defaultValue: "25rem",
          },
          placeholder: {
            type: "string",
            defaultValue: "",
          },
          spellChecker: {
            type: "boolean",
            defaultValue: false,
          },
          imageUploadable: {
            type: "boolean",
            defaultValue: false,
          },
          lineWrapping: {
            type: "boolean",
            defaultValue: true,
          },
          toolbar: {
            type: "object",
            defaultValue: [
              "heading",
              "bold",
              "italic",
              "|",
              "quote",
              "code",
              "link",
              "image",
              "|",
              "unordered-list",
              "ordered-list",
              "|",
              "preview",
              "|",
              "guide",
            ],
          },
          value: {
            type: "string",
            defaultValue: "",
          },
          maxLength: {
            type: "int",
            defaultValue: "3000",
          },
          valueState: {
            type: "sap.ui.core.ValueState",
            group: "Appearance",
            defaultValue: sap.ui.core.ValueState.None,
          },
          valueStateText: {
            type: "string",
            group: "Misc",
            defaultValue: "",
          },
          required: {
            type: "boolean",
            defaultValue: false,
          },
        },
        events: {
          liveChange: {
            parameters: {
              value: {
                type: "string",
              },
            },
          },
          uploadImage: {
            parameters: {
              file: {
                type: "object",
              },
              onSuccess: {
                type: "function",
              },
              onError: {
                type: "function",
              },
            },
          },
        },
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      // Lifecycle
      ////////////////////////////////////////////////////////////////////////////////////////////////////

      onAfterRendering: function () {
        var jQueryElement = $("#" + this.getId() + "-textarea");
        // var jQueryElement = $("#" + this.getId());

        // Check if EasyMDE Elements are already rendered
        if (jQueryElement.parent().children(".CodeMirror").length > 0) {
          return;
        }

        var oControl = this;
        this.oEasyMDE = new EasyMDE({
          element: jQueryElement[0],
          spellChecker: oControl.getSpellChecker(),
          placeholder: oControl.getPlaceholder(),
          toolbar: oControl.getToolbar(),
          uploadImage: oControl.getImageUploadable(),
          imageUploadFunction: function (file, onSuccess, onError) {
            oControl.fireUploadImage({
              file: file,
              onSuccess: onSuccess,
              onError: onError,
            });
          }.bind(this),
          status: false,
          lineWrapping: oControl.getLineWrapping(),
        });

        this.oEasyMDE.codemirror.on("blur", function () {
          oControl.setValue(oControl.oEasyMDE.value());
        });
        //use change instead of update, as this will only be called when there is a change different from the initial state
        this.oEasyMDE.codemirror.on("change", function () {
          oControl.setValue(oControl.oEasyMDE.value());
          oControl.fireLiveChange({
            value: oControl.getValue(),
          });
        });

        //implementation for maxLength property
        if (this.getMaxLength() > 0) {
          this.oEasyMDE.codemirror.on(
            "beforeChange",
            function (cm, change) {
              if (change.update) {
                var str = change.text.join("\n");

                var delta =
                  str.length -
                  (cm.indexFromPos(change.to) - cm.indexFromPos(change.from));

                if (delta <= 0) {
                  return true;
                }

                delta = cm.getValue().length + delta - this.getMaxLength();

                if (delta > 0) {
                  str = str.substr(0, str.length - delta);
                  change.update(change.from, change.to, str.split("\n"));
                }
              }
              return true;
            }.bind(this)
          );
        }

        this.oEasyMDE.codemirror.options.extraKeys["Tab"] = false;
        this.oEasyMDE.codemirror.options.extraKeys["Shift-Tab"] = false;

        // $('.CodeMirror').addClass("sapMInputBaseInner");
        $(".CodeMirror")
          .css("height", this.getHeight())
          .css("min-height", this.getMinHeight());
        $(".CodeMirror-scroll").css("min-height", this.getMinHeight());
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      // Renderer
      ////////////////////////////////////////////////////////////////////////////////////////////////////

      getDomRefForValueStateMessage: function () {
        return $(".CodeMirror").get()[0];
      },

      renderer: function (oRm, oControl) {
        oRm.write("<div ");
        oRm.writeAttributeEscaped("id", oControl.getId());
        oRm.write(" >");
        oRm.write("<textarea width='100%'");
        oRm.addStyle("display", "none");
        oRm.addStyle("height", "0px");
        oRm.addStyle("width", "100%");
        oRm.addStyle("padding", "0px");
        oRm.addStyle("margin", "0px");
        oRm.writeStyles();
        oRm.writeAttributeEscaped("id", oControl.getId() + "-textarea");
        oRm.write(" >");
        oRm.write(oControl.getValue());
        oRm.write("</textarea>");
        oRm.write("</div>");
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      // public
      ////////////////////////////////////////////////////////////////////////////////////////////////////

      getSimpleMDE: function () {
        return this.oEasyMDE;
      },

      //this is necessary to enable proper data binding on the text field of the editor
      setValue: function (sValue) {
        this.setProperty("value", sValue, true);

        if (
          sValue !== undefined &&
          this.oEasyMDE &&
          this.oEasyMDE.value() !== sValue
        ) {
          this.oEasyMDE.value(sValue);
        }
      },

      setValueState: function (sValue) {
        // Set property
        this.setProperty("valueState", sValue, true);

        // ValueStateMessage
        if (this.shouldValueStateMessageBeOpened()) {
          this.openValueStateMessage();
        } else {
          this.closeValueStateMessage();
        }

        // Remove current state
        this.getDomRefForValueStateMessage().classList.remove(
          "sapMInputBaseStateInner"
        );
        this.getDomRefForValueStateMessage().classList.remove(
          "sapMInputBaseErrorInner"
        );
        this.getDomRefForValueStateMessage().classList.remove(
          "sapMInputBaseWarningInner"
        );
        this.getDomRefForValueStateMessage().classList.remove(
          "sapMInputBaseSuccessInner"
        );

        // Add current state (Border around input area)
        if (sValue === sap.ui.core.ValueState.Error) {
          this.getDomRefForValueStateMessage().classList.add(
            "sapMInputBaseStateInner"
          );
          this.getDomRefForValueStateMessage().classList.add(
            "sapMInputBaseErrorInner"
          );
        } else if (sValue === sap.ui.core.ValueState.Warning) {
          this.getDomRefForValueStateMessage().classList.add(
            "sapMInputBaseStateInner"
          );
          this.getDomRefForValueStateMessage().classList.add(
            "sapMInputBaseWarningInner"
          );
        } else if (sValue === sap.ui.core.ValueState.Success) {
          this.getDomRefForValueStateMessage().classList.add(
            "sapMInputBaseStateInner"
          );
          this.getDomRefForValueStateMessage().classList.add(
            "sapMInputBaseSuccessInner"
          );
        }
      },

      ////////////////////////////////////////////////////////////////////////////////////////////////////
      // protected
      ////////////////////////////////////////////////////////////////////////////////////////////////////

      // Can be used to enforce a re-rendering of the SimpleMDE DOM Elements
      // Needed e.g. in case of resize, option change (TODO), etc.
      _destroy: function () {
        if (this.oEasyMDE) {
          this.oEasyMDE.toTextArea();
          this.oEasyMDE = null;
        }
      },
    });

    return MarkdownEditor;
  }
);
