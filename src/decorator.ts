import { clearTimeout } from 'timers';
import * as vscode from 'vscode';
import { ExtensionContext } from 'vscode';

export function activate(context: ExtensionContext) {
    let decorator = new Decorator();

    vscode.window.onDidChangeActiveTextEditor(editor => {
        decorator.changeActiveTextEditor(editor);
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        decorator.changeTextDocument(event);
    }, null, context.subscriptions);
}

class DecorationTypes {
    done!: vscode.TextEditorDecorationType;
    unDone!: vscode.TextEditorDecorationType;
    wip!: vscode.TextEditorDecorationType;
}

class Decorator {
    private activeEditor = vscode.window.activeTextEditor;
    private timeout: NodeJS.Timer | undefined = undefined;
    private decorationTypes: DecorationTypes;
    private settings = vscode.workspace.getConfiguration('md-checkbox-highlight');

    constructor() {
        this.decorationTypes = new DecorationTypes();
        this.setDecorators();

        if (this.activeEditor) {
            this.triggerUpdateDecorations();
        }
    }

    private setDecorators(): void {
        this.decorationTypes.done = vscode.window.createTextEditorDecorationType({
            light: {},
            dark: {
                color: this.settings.get('doneTodoColor')
            }
        });
        this.decorationTypes.unDone = vscode.window.createTextEditorDecorationType({
            light: {},
            dark: {
                color: this.settings.get('undoneTodoColor')
            }
        });
        this.decorationTypes.wip = vscode.window.createTextEditorDecorationType({
            light: {},
            dark: {
                color: this.settings.get('wipTodoColor')
            }
        });
    }

    public changeActiveTextEditor(editor: vscode.TextEditor | undefined): void {
        this.activeEditor = editor;
        if (editor) {
            this.triggerUpdateDecorations();
        }
    }

    public changeTextDocument(event: vscode.TextDocumentChangeEvent): void {
        if (this.activeEditor && event.document === this.activeEditor.document) {
            this.triggerUpdateDecorations();
        }
    }

    private triggerUpdateDecorations(): void {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = undefined;
        }
        this.timeout = setTimeout(() => {
            this.updateDecorations();
        }, 500);
    }


    private updateDecorations(): void {
        if (!this.activeEditor) {
            return;
        }
        let fileType = this.activeEditor.document.fileName.split('.')?.pop();
        if (fileType !== 'md') {
            return;
        }
        const regEx = /\[[\sx>]\]\s.*/g;
        const text = this.activeEditor.document.getText();
        const dones: vscode.DecorationOptions[] = [];
        const unDones: vscode.DecorationOptions[] = [];
        const wips: vscode.DecorationOptions[] = [];
        let match;
        while ((match = regEx.exec(text))) {
            const startPos = this.activeEditor.document.positionAt(match.index);
            const endPos = this.activeEditor.document.positionAt(match.index + match[0].length);
            const decoration = {
                range: new vscode.Range(startPos, endPos)
                //,hoverMessage: 'hover'
            };
            switch (match[0].charAt(1)) {
                case 'x':
                    dones.push(decoration);
                    break;
                case ' ':
                    unDones.push(decoration);
                    break;
                case '>':
                    wips.push(decoration);
                    break;
                default:
                    unDones.push(decoration);
                    break;
            }
        }
        this.activeEditor.setDecorations(this.decorationTypes.done, dones);
        this.activeEditor.setDecorations(this.decorationTypes.unDone, unDones);
        this.activeEditor.setDecorations(this.decorationTypes.wip, wips);
    }
}
