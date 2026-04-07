using FluentValidation;
using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Validators;

public class CreatePostRequestValidator : AbstractValidator<CreatePostRequest>
{
    public CreatePostRequestValidator()
    {
        RuleFor(x => x.Category).IsInEnum().WithMessage("Categoria inválida.");
        RuleFor(x => x.Body)
            .NotEmpty().WithMessage("Corpo obrigatório.")
            .MinimumLength(1)
            .MaximumLength(2000).WithMessage("Corpo não pode exceder 2000 caracteres.");
    }
}
