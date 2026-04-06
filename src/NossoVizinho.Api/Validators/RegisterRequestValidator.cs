using FluentValidation;
using NossoVizinho.Api.Models.DTOs;

namespace NossoVizinho.Api.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-mail obrigatorio.")
            .EmailAddress().WithMessage("E-mail invalido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha obrigatoria.")
            .MinimumLength(8).WithMessage("Senha deve ter no minimo 8 caracteres.")
            .Matches("[A-Z]").WithMessage("Senha deve conter pelo menos uma letra maiuscula.")
            .Matches("[0-9]").WithMessage("Senha deve conter pelo menos um numero.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Senha deve conter pelo menos um caractere especial.");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("As senhas nao coincidem.");

        RuleFor(x => x.AcceptedPrivacyPolicy)
            .Equal(true).WithMessage("Voce deve aceitar a politica de privacidade.");
    }
}
