-- Keep placeholder links non-functional until their central configuration value
-- is replaced in _variables.yml.

local function text_of(value)
  if value == nil then
    return ""
  end
  return pandoc.utils.stringify(value)
end

function Link(element)
  local target = text_of(element.target)

  if target == "mailto:" or
      target:find("PROJECT_EMAIL_PLACEHOLDER", 1, true) or
      target:find("{{< var project-email", 1, true) then
    return pandoc.Str("A project email address will be published before the first release.")
  end

  if target == "" or
      target:find("GITHUB_ORG_PLACEHOLDER", 1, true) or
      target:find("{{< var github-organization", 1, true) then
    return pandoc.Str("The public repository link will be added once the organization is confirmed.")
  end

  return element
end
