using FluentValidation;
using BairroNow.Api.Models.DTOs;

namespace BairroNow.Api.Validators;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("E-mail obrigatorio.")
            .EmailAddress().WithMessage("E-mail invalido.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Senha obrigatoria.");
    }
}
