/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IObservable, autorun } from '../../../../../base/common/observable.js';
import { InlineCompletionsModel } from '../model/inlineCompletionsModel.js';
import { RawContextKey, IContextKeyService } from '../../../../../platform/contextkey/common/contextkey.js';
import { Disposable } from '../../../../../base/common/lifecycle.js';
import { localize } from '../../../../../nls.js';
import { bindContextKey } from '../../../../../platform/observable/common/platformObservableUtils.js';

export class InlineCompletionContextKeys extends Disposable {

	public static readonly inlineSuggestionVisible = new RawContextKey<boolean>('inlineSuggestionVisible', false, localize('inlineSuggestionVisible', "Whether an inline suggestion is visible"));
	public static readonly inlineSuggestionHasIndentation = new RawContextKey<boolean>('inlineSuggestionHasIndentation', false, localize('inlineSuggestionHasIndentation', "Whether the inline suggestion starts with whitespace"));
	public static readonly inlineSuggestionHasIndentationLessThanTabSize = new RawContextKey<boolean>('inlineSuggestionHasIndentationLessThanTabSize', true, localize('inlineSuggestionHasIndentationLessThanTabSize', "Whether the inline suggestion starts with whitespace that is less than what would be inserted by tab"));
	public static readonly suppressSuggestions = new RawContextKey<boolean | undefined>('inlineSuggestionSuppressSuggestions', undefined, localize('suppressSuggestions', "Whether suggestions should be suppressed for the current suggestion"));

	public static readonly cursorInIndentation = new RawContextKey<boolean | undefined>('cursorInIndentation', false, localize('cursorInIndentation', "Whether the cursor is in indentation"));
	public static readonly hasSelection = new RawContextKey<boolean | undefined>('editor.hasSelection', false, localize('editor.hasSelection', "Whether the editor has a selection"));
	public static readonly cursorAtInlineEdit = new RawContextKey<boolean | undefined>('cursorAtInlineEdit', false, localize('cursorAtInlineEdit', "Whether the cursor is at an inline edit"));
	public static readonly inlineEditVisible = new RawContextKey<boolean>('inlineEditIsVisible', false, localize('inlineEditVisible', "Whether an inline edit is visible"));
	public static readonly tabShouldJumpToInlineEdit = new RawContextKey<boolean | undefined>('tabShouldJumpToInlineEdit', false, localize('tabShouldJumpToInlineEdit', "Whether tab should jump to an inline edit."));
	public static readonly tabShouldAcceptInlineEdit = new RawContextKey<boolean | undefined>('tabShouldAcceptInlineEdit', false, localize('tabShouldAcceptInlineEdit', "Whether tab should accept the inline edit."));

	public readonly inlineCompletionVisible = InlineCompletionContextKeys.inlineSuggestionVisible.bindTo(this.contextKeyService);
	public readonly inlineCompletionSuggestsIndentation = InlineCompletionContextKeys.inlineSuggestionHasIndentation.bindTo(this.contextKeyService);
	public readonly inlineCompletionSuggestsIndentationLessThanTabSize = InlineCompletionContextKeys.inlineSuggestionHasIndentationLessThanTabSize.bindTo(this.contextKeyService);
	public readonly suppressSuggestions = InlineCompletionContextKeys.suppressSuggestions.bindTo(this.contextKeyService);

	constructor(
		private readonly contextKeyService: IContextKeyService,
		private readonly model: IObservable<InlineCompletionsModel | undefined>,
	) {
		super();

		this._register(bindContextKey(
			InlineCompletionContextKeys.inlineEditVisible,
			this.contextKeyService,
			reader => this.model.read(reader)?.inlineEditState.read(reader) !== undefined
		));

		this._register(autorun(reader => {
			/** @description update context key: inlineCompletionVisible, suppressSuggestions */
			const model = this.model.read(reader);
			const state = model?.inlineCompletionState.read(reader);

			const isInlineCompletionVisible = !!state?.inlineCompletion && state?.primaryGhostText !== undefined && !state?.primaryGhostText.isEmpty();
			this.inlineCompletionVisible.set(isInlineCompletionVisible);

			if (state?.primaryGhostText && state?.inlineCompletion) {
				this.suppressSuggestions.set(state.inlineCompletion.inlineCompletion.source.inlineCompletions.suppressSuggestions);
			}
		}));

		this._register(autorun(reader => {
			/** @description update context key: inlineCompletionSuggestsIndentation, inlineCompletionSuggestsIndentationLessThanTabSize */
			const model = this.model.read(reader);
			const result = model?.getIndentationInfo(reader);
			this.inlineCompletionSuggestsIndentation.set(result?.startsWithIndentation ?? false);
			this.inlineCompletionSuggestsIndentationLessThanTabSize.set(result?.startsWithIndentationLessThanTabSize ?? true);
		}));
	}
}
