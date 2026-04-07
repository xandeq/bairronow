using FluentValidation;
using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Validators;

public class CreateReportRequestValidator : AbstractValidator<CreateReportRequest>
{
    public CreateReportRequestValidator()
    {
        RuleFor(x => x.TargetType)
            .NotEmpty()
            .Must(t => t == "post" || t == "comment").WithMessage("targetType deve ser 'post' ou 'comment'.");
        RuleFor(x => x.TargetId).GreaterThan(0);
        RuleFor(x => x.Reason).IsInEnum();
        RuleFor(x => x.Note).MaximumLength(500);
    }
}
