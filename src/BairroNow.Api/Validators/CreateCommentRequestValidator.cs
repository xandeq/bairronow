using FluentValidation;
using BairroNow.Api.Models.DTOs;

namespace BairroNow.Api.Validators;

public class CreateCommentRequestValidator : AbstractValidator<CreateCommentRequest>
{
    public CreateCommentRequestValidator()
    {
        RuleFor(x => x.PostId).GreaterThan(0).WithMessage("postId inválido.");
        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Corpo obrigatório.")
            .MaximumLength(500).WithMessage("Corpo não pode exceder 500 caracteres.");
        When(x => x.ParentCommentId.HasValue, () =>
        {
            RuleFor(x => x.ParentCommentId!.Value).GreaterThan(0);
        });
    }
}
